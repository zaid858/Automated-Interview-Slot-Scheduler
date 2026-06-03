"""
CSP Heuristics: MRV, LCV, Forward Checking, AC-3
"""
from .constraints import check_hard_constraints


def select_unassigned_variable_mrv(variables, domains, assignment):
    """
    MRV (Minimum Remaining Values): Select the unassigned variable
    with the smallest domain (fewest valid options left).
    Ties broken by degree (most constraints with other unassigned vars).
    """
    unassigned = [v for v in variables if v not in assignment]
    if not unassigned:
        return None

    return min(unassigned, key=lambda v: len(domains.get(v, [])))


def order_domain_values_lcv(var, domain, assignment, variables, domains,
                             candidates, interviewers, slots, rooms):
    """
    LCV (Least Constraining Value): Order domain values such that the
    value chosen removes the fewest options from neighboring variables.
    """
    def count_eliminations(value):
        count = 0
        for other_var in variables:
            if other_var == var or other_var in assignment:
                continue
            for other_val in domains.get(other_var, []):
                test_assignment = dict(assignment)
                test_assignment[var] = value
                if not check_hard_constraints(
                    other_var, other_val, test_assignment,
                    candidates, interviewers, slots, rooms
                ):
                    count += 1
        return count

    return sorted(domain, key=count_eliminations)


def forward_check(var, value, domains, assignment, variables,
                  candidates, interviewers, slots, rooms):
    """
    Forward Checking: After assigning var=value, prune domains of
    unassigned neighboring variables. Returns pruned domains or None on failure.
    """
    pruned = {}
    test_assignment = dict(assignment)
    test_assignment[var] = value

    for other_var in variables:
        if other_var in test_assignment:
            continue

        new_domain = []
        for val in domains.get(other_var, []):
            if check_hard_constraints(
                other_var, val, test_assignment,
                candidates, interviewers, slots, rooms
            ):
                new_domain.append(val)

        if not new_domain:
            return None  # Domain wipeout — prune failed

        pruned[other_var] = new_domain

    return pruned


def ac3(variables, domains, candidates, interviewers, slots, rooms):
    """
    AC-3 Arc Consistency Algorithm.
    Reduces domains before search begins by removing values that
    can never be part of a consistent assignment.
    Returns False if any domain becomes empty (no solution possible).
    """
    # Build arc queue: all (Xi, Xj) pairs
    queue = [(xi, xj) for xi in variables for xj in variables if xi != xj]

    while queue:
        xi, xj = queue.pop(0)
        if revise(xi, xj, domains, candidates, interviewers, slots, rooms):
            if not domains[xi]:
                return False  # No solution
            # Add all neighbors of Xi back to queue (except Xj)
            for xk in variables:
                if xk != xi and xk != xj:
                    queue.append((xk, xi))

    return True


def revise(xi, xj, domains, candidates, interviewers, slots, rooms):
    """
    Remove values from domain(Xi) that have no support in domain(Xj).
    Returns True if domain(Xi) was changed.
    """
    revised = False
    to_remove = []

    for x in domains.get(xi, []):
        # Check if there exists any y in domain(Xj) consistent with x
        supported = False
        test_assignment = {xi: x}
        for y in domains.get(xj, []):
            if check_hard_constraints(xj, y, test_assignment,
                                      candidates, interviewers, slots, rooms):
                supported = True
                break
        if not supported:
            to_remove.append(x)
            revised = True

    for x in to_remove:
        domains[xi].remove(x)

    return revised
