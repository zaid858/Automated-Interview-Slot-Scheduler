"""
Core CSP Backtracking Solver for Interview Scheduling.
Implements: AC-3 → Backtracking + MRV + LCV + Forward Checking
"""
import time
import copy
from .constraints import check_hard_constraints
from .heuristics import (
    select_unassigned_variable_mrv,
    order_domain_values_lcv,
    forward_check,
    ac3,
)


class InterviewScheduler:
    def __init__(self, candidates, interviewers, slots, rooms):
        self.candidates = candidates
        self.interviewers = interviewers
        self.slots = [s for s in slots if not s.get('is_break', False)]
        self.rooms = rooms
        self.backtracks = 0
        self.start_time = None

    def build_variables(self):
        """
        Variables: one per (candidate, round) pair.
        E.g., candidate 1 needs 2 rounds → variables: (1,1) and (1,2)
        """
        variables = []
        for candidate in self.candidates:
            num_rounds = candidate.get('rounds', 1)
            for r in range(1, num_rounds + 1):
                variables.append((candidate['id'], r))
        return variables

    def build_domains(self, variables):
        """
        Domain of each variable: all valid (slot_id, interviewer_id, room_id) combos.
        Pre-filtered by individual availability.
        """
        domains = {}
        for var in variables:
            candidate_id, round_num = var
            candidate = next((c for c in self.candidates if c['id'] == candidate_id), None)
            if not candidate:
                domains[var] = []
                continue

            candidate_avail = set(candidate.get('availability', []))
            domain = []

            for slot in self.slots:
                if slot['id'] not in candidate_avail:
                    continue
                for interviewer in self.interviewers:
                    iv_avail = set(interviewer.get('availability', []))
                    if slot['id'] not in iv_avail:
                        continue
                    for room in self.rooms:
                        domain.append((slot['id'], interviewer['id'], room['id']))

            domains[var] = domain

        return domains

    def solve(self):
        """
        Main solve method.
        Returns dict with schedule, stats, and quality info.
        """
        self.start_time = time.time()
        self.backtracks = 0

        variables = self.build_variables()
        domains = self.build_domains(variables)

        # Check if any variable has empty domain before starting
        for var, domain in domains.items():
            if not domain:
                return {
                    'success': False,
                    'error': f'No valid slots for candidate {var[0]} round {var[1]}',
                    'schedule': [],
                    'stats': {'backtracks': 0, 'time_ms': 0}
                }

        # Phase 1: AC-3 preprocessing to reduce domains
        domains_copy = copy.deepcopy(domains)
        ac3_result = ac3(variables, domains_copy, self.candidates,
                         self.interviewers, self.slots, self.rooms)

        if not ac3_result:
            return {
                'success': False,
                'error': 'AC-3 detected no feasible solution — constraints too tight',
                'schedule': [],
                'stats': {'backtracks': 0, 'time_ms': 0}
            }

        # Phase 2: Backtracking search
        assignment = {}
        result = self._backtrack(assignment, variables, domains_copy)

        elapsed_ms = int((time.time() - self.start_time) * 1000)

        if result is None:
            return {
                'success': False,
                'error': 'No valid schedule found with given constraints',
                'schedule': [],
                'stats': {'backtracks': self.backtracks, 'time_ms': elapsed_ms}
            }

        # Build structured schedule output
        schedule = self._build_schedule(result)

        return {
            'success': True,
            'schedule': schedule,
            'stats': {
                'backtracks': self.backtracks,
                'time_ms': elapsed_ms,
                'total_interviews': len(schedule)
            }
        }

    def _backtrack(self, assignment, variables, domains):
        """Recursive backtracking with MRV + LCV + Forward Checking."""
        if len(assignment) == len(variables):
            return assignment  # Complete assignment found

        # MRV: select variable with smallest remaining domain
        var = select_unassigned_variable_mrv(variables, domains, assignment)
        if var is None:
            return None

        # LCV: order values to minimise impact on other variables
        ordered_values = order_domain_values_lcv(
            var, domains.get(var, []), assignment, variables, domains,
            self.candidates, self.interviewers, self.slots, self.rooms
        )

        for value in ordered_values:
            if check_hard_constraints(var, value, assignment,
                                      self.candidates, self.interviewers,
                                      self.slots, self.rooms):
                assignment[var] = value

                # Forward Checking: prune neighbors
                inferences = forward_check(
                    var, value, domains, assignment, variables,
                    self.candidates, self.interviewers, self.slots, self.rooms
                )

                if inferences is not None:
                    # Save current domains, apply inferences
                    saved = {k: list(v) for k, v in domains.items()}
                    for k, v in inferences.items():
                        domains[k] = v

                    result = self._backtrack(assignment, variables, domains)
                    if result is not None:
                        return result

                    # Restore domains on backtrack
                    for k, v in saved.items():
                        domains[k] = v

                del assignment[var]
                self.backtracks += 1

        return None  # No valid value found → backtrack

    def _build_schedule(self, assignment):
        """Convert assignment dict to structured schedule list."""
        schedule = []
        for (candidate_id, round_num), (slot_id, interviewer_id, room_id) in assignment.items():
            slot = next((s for s in self.slots if s['id'] == slot_id), {})
            schedule.append({
                'candidate_id': candidate_id,
                'round': round_num,
                'slot_id': slot_id,
                'interviewer_id': interviewer_id,
                'room_id': room_id,
                'date': slot.get('date', ''),
                'start_time': slot.get('start_time', ''),
                'end_time': slot.get('end_time', ''),
            })

        # Sort by date then start_time
        schedule.sort(key=lambda x: (x['date'], x['start_time']))
        return schedule
