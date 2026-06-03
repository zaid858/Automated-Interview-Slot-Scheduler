"""
Hill Climbing Optimizer for post-CSP schedule improvement.
Tries swapping assignments to reduce soft constraint violations.
"""
import random
import copy
from .constraints import evaluate_soft_constraints


def optimize(schedule, candidates, interviewers, slots, rooms, max_iterations=500):
    """
    Hill Climbing: iteratively swap two assignments and keep if quality improves.
    Returns optimized schedule and quality score.
    """
    if len(schedule) < 2:
        score = evaluate_soft_constraints(schedule, candidates, interviewers, slots)
        return schedule, round(score, 2)

    current = copy.deepcopy(schedule)
    current_score = evaluate_soft_constraints(current, candidates, interviewers, slots)

    for iteration in range(max_iterations):
        # Pick two random assignments to swap slots
        i, j = random.sample(range(len(current)), 2)

        # Only swap if same candidate (swap rounds) or different candidates
        neighbor = copy.deepcopy(current)

        # Swap slot_id, date, start_time, end_time between two entries
        (neighbor[i]['slot_id'], neighbor[j]['slot_id']) = \
            (neighbor[j]['slot_id'], neighbor[i]['slot_id'])
        (neighbor[i]['date'], neighbor[j]['date']) = \
            (neighbor[j]['date'], neighbor[i]['date'])
        (neighbor[i]['start_time'], neighbor[j]['start_time']) = \
            (neighbor[j]['start_time'], neighbor[i]['start_time'])
        (neighbor[i]['end_time'], neighbor[j]['end_time']) = \
            (neighbor[j]['end_time'], neighbor[i]['end_time'])

        neighbor_score = evaluate_soft_constraints(
            neighbor, candidates, interviewers, slots
        )

        if neighbor_score >= current_score:
            current = neighbor
            current_score = neighbor_score

    return current, round(current_score, 2)
