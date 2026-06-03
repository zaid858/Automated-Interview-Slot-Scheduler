"""
CSP Constraints for Interview Scheduling
Hard constraints must not be violated.
Soft constraints contribute to quality score.
"""


def check_hard_constraints(var, value, assignment, candidates, interviewers, slots, rooms):
    """
    Returns True if assigning `value` to `var` satisfies all hard constraints.
    var   = (candidate_id, round_num)
    value = (slot_id, interviewer_id, room_id)
    """
    slot_id, interviewer_id, room_id = value
    candidate_id, round_num = var

    # Find the slot object
    slot = next((s for s in slots if s['id'] == slot_id), None)
    if slot is None or slot.get('is_break', False):
        return False

    # Find candidate and interviewer
    candidate = next((c for c in candidates if c['id'] == candidate_id), None)
    interviewer = next((iv for iv in interviewers if iv['id'] == interviewer_id), None)

    if candidate is None or interviewer is None:
        return False

    # Hard Constraint 1: Candidate must be available in this slot
    if slot_id not in candidate.get('availability', []):
        return False

    # Hard Constraint 2: Interviewer must be available in this slot
    if slot_id not in interviewer.get('availability', []):
        return False

    # Check against already-assigned interviews
    for assigned_var, assigned_val in assignment.items():
        a_slot_id, a_interviewer_id, a_room_id = assigned_val
        a_candidate_id, a_round = assigned_var

        # Find assigned slot details
        a_slot = next((s for s in slots if s['id'] == a_slot_id), None)
        if a_slot is None:
            continue

        # Hard Constraint 3: No interviewer double-booking at same time
        if a_interviewer_id == interviewer_id and slots_overlap(slot, a_slot, slots):
            return False

        # Hard Constraint 4: No room double-booking at same time
        if a_room_id == room_id and slots_overlap(slot, a_slot, slots):
            return False

        # Hard Constraint 5: Same candidate cannot have two interviews at same time
        if a_candidate_id == candidate_id and slots_overlap(slot, a_slot, slots):
            return False

        # Hard Constraint 6: Minimum gap between rounds for same candidate
        if a_candidate_id == candidate_id:
            if not sufficient_gap(slot, a_slot, slots, min_gap=1):
                return False

    return True


def slots_overlap(slot_a, slot_b, slots):
    """Returns True if two slots are on the same day and overlap in time."""
    if slot_a['date'] != slot_b['date']:
        return False
    # Simple check: same start time means overlap (slots are non-overlapping blocks)
    return slot_a['start_time'] == slot_b['start_time']


def sufficient_gap(slot_a, slot_b, slots, min_gap=1):
    """
    Ensures at least min_gap slots between interviews on the same day.
    Compares slot positions within the same day.
    """
    if slot_a['date'] != slot_b['date']:
        return True  # Different days — no gap issue

    # Find all slots on this day, sorted by start_time
    day_slots = sorted(
        [s for s in slots if s['date'] == slot_a['date']],
        key=lambda s: s['start_time']
    )

    idx_a = next((i for i, s in enumerate(day_slots) if s['id'] == slot_a['id']), -1)
    idx_b = next((i for i, s in enumerate(day_slots) if s['id'] == slot_b['id']), -1)

    if idx_a == -1 or idx_b == -1:
        return True

    return abs(idx_a - idx_b) >= min_gap + 1


def evaluate_soft_constraints(schedule, candidates, interviewers, slots):
    """
    Score the schedule based on soft constraints.
    Returns a score from 0 to 100.
    """
    score = 100.0
    total_checks = 0
    violations = 0

    # Soft Constraint 1: Higher priority candidates get earlier slots
    priority_groups = {}
    for entry in schedule:
        c_id = entry['candidate_id']
        candidate = next((c for c in candidates if c['id'] == c_id), None)
        if candidate:
            priority = candidate.get('priority', 5)
            slot = next((s for s in slots if s['id'] == entry['slot_id']), None)
            if slot:
                priority_groups.setdefault(priority, []).append(slot['start_time'])

    # Soft Constraint 2: Interviewers should not exceed 5 interviews per day
    interviewer_day_count = {}
    for entry in schedule:
        slot = next((s for s in slots if s['id'] == entry['slot_id']), None)
        if slot:
            key = (entry['interviewer_id'], slot['date'])
            interviewer_day_count[key] = interviewer_day_count.get(key, 0) + 1
            total_checks += 1
            iv = next((iv for iv in interviewers if iv['id'] == entry['interviewer_id']), None)
            if iv and interviewer_day_count[key] > iv.get('max_per_day', 5):
                violations += 1

    if total_checks == 0:
        return 100.0

    penalty = (violations / total_checks) * 50
    return max(0.0, score - penalty)
