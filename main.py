from flask import Flask, render_template, jsonify, request, session
import os
import re
import json

app = Flask(__name__)
app.secret_key = 'sat-prep-secret-key-12345'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Real SAT timing in seconds
RW_TIME = 64 * 60  # 64 minutes for Reading & Writing
MATH_TIME = 70 * 60  # 70 minutes for Math

def parse_test_file(filename):
    """Parse a SAT test markdown file into structured data"""
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        return None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if len(content.strip()) < 100:
        return None
    
    # Extract title
    lines = content.split('\n')
    title = lines[0].strip() if lines else f"SAT Practice Test"
    
    # Parse questions
    questions = []
    current_question = None
    current_choices = []
    in_passage = False
    current_passage = []
    passage_title = ""
    
    # Regex patterns
    question_pattern = re.compile(r'^(?:The |Which |What |How |According |Based |As used |In |Unlike |Both |Why |If |A |An |The passage |The author |The narrator |The phrase |The word |The example |The tone |The function |Evidence |Hurricanes |Scientists |Mozart |Although |Despite |Having |Damaged |Neither |Either |When |The collection |The jury |The reason |Birds |Plastic |Meditation |Global |The drought |The designer |Finishing |My neighbor |The new |The updated )')
    choice_pattern = re.compile(r'^\s*([A-D])\)\s*(.+)$')
    choice_pattern2 = re.compile(r'^\s*([A-D])\.\s*(.+)$')
    passage_header = re.compile(r'^Questions \d+.*?:.*Passage')
    
    i = 0
    question_num = 0
    in_math_section = False
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Check for Math section - clear passages when we enter math
        if 'MATH' in line.upper() and ('SECTION' in line.upper() or 'Questions' in line):
            in_math_section = True
            current_passage = []
            passage_title = ""
            in_passage = False
            i += 1
            continue
        
        # Check for passage header (only in RW section)
        if not in_math_section and (passage_header.match(line) or (line.startswith('Questions ') and 'Passage' in line)):
            in_passage = True
            current_passage = []
            passage_title = ""
            i += 1
            # Get passage title (next non-empty line)
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i < len(lines):
                passage_title = lines[i].strip()
                i += 1
            # Collect passage text until we hit a question
            while i < len(lines):
                pline = lines[i].strip()
                # Check if this line starts a question (ends with a question-like pattern)
                if pline and (pline.endswith('?') or 
                             pline.startswith('The passage primarily') or
                             pline.startswith('Which choice') or
                             pline.startswith('As used') or
                             pline.startswith('The author') or
                             pline.startswith('Based on') or
                             pline.startswith('According to') or
                             re.match(r'^[A-D]\)', pline) or
                             re.match(r'^\s*[A-D]\.', pline)):
                    break
                if pline and not re.match(r'^[A-D]\)', pline):
                    current_passage.append(pline)
                i += 1
            continue
        
        # Check for choice
        choice_match = choice_pattern.match(line) or choice_pattern2.match(line)
        if choice_match:
            key = choice_match.group(1)
            text = choice_match.group(2).strip()
            current_choices.append({'key': key, 'text': text})
            
            # If we have 4 choices, save the question
            if len(current_choices) == 4 and current_question:
                question_num += 1
                questions.append({
                    'id': question_num,
                    'prompt': current_question,
                    'choices': current_choices,
                    'passage': '\n'.join(current_passage) if current_passage else None,
                    'passage_title': passage_title if passage_title else None
                })
                current_question = None
                current_choices = []
            i += 1
            continue
        
        # Check if this is a question prompt (non-empty, not a choice, ends appropriately)
        if line and not re.match(r'^[A-D][\.\)]', line):
            # Could be a question - look ahead for choices
            j = i + 1
            has_choices = False
            while j < min(i + 10, len(lines)):
                next_line = lines[j].strip()
                if re.match(r'^\s*[A-D][\.\)]', next_line):
                    has_choices = True
                    break
                j += 1
            
            if has_choices and len(line) > 10:
                # This is likely a question
                if current_question and current_choices:
                    # Save previous incomplete question
                    pass
                current_question = line
                current_choices = []
        
        i += 1
    
    # Parse answer key
    answers = {}
    answer_section = re.search(r'(?:Answer Key|ANSWER KEY)(.*?)$', content, re.DOTALL | re.IGNORECASE)
    if answer_section:
        answer_text = answer_section.group(1)
        # Find patterns like "1.B" or "1 B" or "1. B"
        ans_matches = re.findall(r'(\d+)[\.\s]*([A-D])', answer_text)
        for num, ans in ans_matches:
            answers[int(num)] = ans
    
    # Assign answers to questions
    for q in questions:
        q['answer'] = answers.get(q['id'], 'A')
    
    # Split into sections (first 54 = RW, rest = Math)
    # Clear passage data for math questions
    rw_questions = [q for q in questions if q['id'] <= 54]
    math_questions = []
    for q in questions:
        if q['id'] > 54:
            # Math questions shouldn't have passages
            q['passage'] = None
            q['passage_title'] = None
            math_questions.append(q)
    
    return {
        'title': title,
        'sections': [
            {
                'id': 'rw',
                'name': 'Reading & Writing',
                'duration_seconds': RW_TIME,
                'questions': rw_questions
            },
            {
                'id': 'math', 
                'name': 'Math',
                'duration_seconds': MATH_TIME,
                'questions': math_questions
            }
        ],
        'total_questions': len(questions)
    }

def get_available_tests():
    """Get list of available test files with content"""
    tests = []
    for filename in sorted(os.listdir(BASE_DIR)):
        if filename.startswith('sat') and filename.endswith('.md'):
            match = re.search(r'sat(\d+)', filename)
            if match:
                num = int(match.group(1))
                filepath = os.path.join(BASE_DIR, filename)
                # Check if file has content
                try:
                    with open(filepath, 'r') as f:
                        content = f.read()
                    if len(content.strip()) > 100:
                        tests.append({'number': num, 'filename': filename})
                except:
                    pass
    return sorted(tests, key=lambda x: x['number'])

@app.route('/')
def index():
    tests = get_available_tests()
    return render_template('index.html', tests=tests)

@app.route('/test/<int:test_num>')
def take_test(test_num):
    filename = f'sat{test_num}.md'
    test_data = parse_test_file(filename)
    if not test_data:
        return "Test not found or empty", 404
    return render_template('test.html', test=test_data, test_num=test_num)

@app.route('/api/test/<int:test_num>')
def api_get_test(test_num):
    filename = f'sat{test_num}.md'
    test_data = parse_test_file(filename)
    if not test_data:
        return jsonify({'error': 'Test not found'}), 404
    return jsonify(test_data)

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'tests_available': len(get_available_tests())})

if __name__ == '__main__':
    print("\n" + "="*50)
    print("  SAT Practice Test App")
    print("  Running on http://127.0.0.1:5001")
    print("="*50 + "\n")
    app.run(host='127.0.0.1', port=5001, debug=True)
