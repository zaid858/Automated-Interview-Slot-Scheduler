"""Flask API routes for the CSP scheduling engine."""
from flask import Blueprint, request, jsonify
from csp.solver import InterviewScheduler
from csp.optimizer import optimize
from csp.constraints import evaluate_soft_constraints

bp = Blueprint('api', __name__)


@bp.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'AI Scheduling Engine'})


@bp.route('/solve', methods=['POST'])
def solve():
    """
    Main scheduling endpoint.
    Body: { candidates, interviewers, slots, rooms, optimize: bool }
    Returns: { success, schedule, quality_score, stats }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON body provided'}), 400

        candidates = data.get('candidates', [])
        interviewers = data.get('interviewers', [])
        slots = data.get('slots', [])
        rooms = data.get('rooms', [])
        run_optimizer = data.get('optimize', True)

        # Validate inputs
        if not candidates:
            return jsonify({'success': False, 'error': 'No candidates provided'}), 400
        if not interviewers:
            return jsonify({'success': False, 'error': 'No interviewers provided'}), 400
        if not slots:
            return jsonify({'success': False, 'error': 'No slots provided'}), 400
        if not rooms:
            return jsonify({'success': False, 'error': 'No rooms provided'}), 400

        # Run CSP solver
        scheduler = InterviewScheduler(candidates, interviewers, slots, rooms)
        result = scheduler.solve()

        if not result['success']:
            return jsonify(result), 422

        # Run optimizer to improve soft constraint satisfaction
        quality_score = 100.0
        if run_optimizer and result['schedule']:
            optimized_schedule, quality_score = optimize(
                result['schedule'], candidates, interviewers, slots, rooms
            )
            result['schedule'] = optimized_schedule
        else:
            quality_score = evaluate_soft_constraints(
                result['schedule'], candidates, interviewers, slots
            )

        result['quality_score'] = quality_score
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/validate', methods=['POST'])
def validate():
    """
    Validate an existing schedule for conflicts.
    Body: { schedule, candidates, interviewers, slots, rooms }
    """
    try:
        data = request.get_json()
        schedule = data.get('schedule', [])
        slots = data.get('slots', [])
        candidates = data.get('candidates', [])
        interviewers = data.get('interviewers', [])

        conflicts = []

        # Check for interviewer double-booking
        seen_iv = {}
        for entry in schedule:
            key = (entry.get('interviewer_id'), entry.get('slot_id'))
            if key in seen_iv:
                conflicts.append({
                    'type': 'interviewer_conflict',
                    'message': f"Interviewer {entry.get('interviewer_id')} double-booked at slot {entry.get('slot_id')}",
                    'severity': 'hard'
                })
            else:
                seen_iv[key] = entry

        # Check for room double-booking
        seen_room = {}
        for entry in schedule:
            key = (entry.get('room_id'), entry.get('slot_id'))
            if key in seen_room:
                conflicts.append({
                    'type': 'room_conflict',
                    'message': f"Room {entry.get('room_id')} double-booked at slot {entry.get('slot_id')}",
                    'severity': 'hard'
                })
            else:
                seen_room[key] = entry

        quality_score = evaluate_soft_constraints(schedule, candidates, interviewers, slots)

        return jsonify({
            'valid': len(conflicts) == 0,
            'conflicts': conflicts,
            'quality_score': quality_score
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
