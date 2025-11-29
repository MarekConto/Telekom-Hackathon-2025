from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import uuid
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
CORS(app)

# Secret key for JWT - in production, use environment variable
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

# Data Storage (In-memory for now, can be persisted to JSON files)
JOBS = []
CANDIDATES = {}
BUILDS = {}
AVATARS = {}
USERS = {}  # Store users: {email: {name, email, password_hash}}

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def load_jobs():
    global JOBS
    jobs_path = os.path.join(DATA_DIR, 'jobs.json')
    if os.path.exists(jobs_path):
        with open(jobs_path, 'r') as f:
            JOBS = json.load(f)
    else:
        # Default dummy jobs if file doesn't exist
        JOBS = [
            {
                "jobId": "job_001",
                "title": "Data Analyst",
                "domain": "data_analytics",
                "description": "Analyze data to help business make better decisions.",
                "skillsRequired": [
                    {"id": "skill_sql", "name": "SQL", "type": "technical", "importance": "critical"},
                    {"id": "skill_python", "name": "Python", "type": "technical", "importance": "high"},
                    {"id": "skill_viz", "name": "Data Visualization", "type": "technical", "importance": "medium"}
                ]
            },
            {
                "jobId": "job_002",
                "title": "Product Owner",
                "domain": "product",
                "description": "Lead the product development lifecycle.",
                "skillsRequired": [
                    {"id": "skill_agile", "name": "Agile Methodologies", "type": "technical", "importance": "critical"},
                    {"id": "skill_comm", "name": "Communication", "type": "soft", "importance": "critical"},
                    {"id": "skill_stakeholder", "name": "Stakeholder Management", "type": "soft", "importance": "high"}
                ]
            }
        ]
        save_jobs()

def save_jobs():
    with open(os.path.join(DATA_DIR, 'jobs.json'), 'w') as f:
        json.dump(JOBS, f, indent=2)

# Initialize data
load_jobs()

# --- Authentication Helper Functions ---
def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

def verify_password(password, hashed):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def generate_token(email):
    """Generate a JWT token for a user"""
    payload = {
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = USERS.get(data['email'])
            
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

# --- Authentication Routes ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # Validation
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if user already exists
    if email in USERS:
        return jsonify({'error': 'User already exists with this email'}), 400
    
    # Create new user
    password_hash = hash_password(password)
    user = {
        'name': name,
        'email': email,
        'password_hash': password_hash,
        'created_at': datetime.utcnow().isoformat()
    }
    
    USERS[email] = user
    
    # Generate token
    token = generate_token(email)
    
    # Return user data (without password hash)
    return jsonify({
        'token': token,
        'user': {
            'name': user['name'],
            'email': user['email']
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login an existing user"""
    data = request.json
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # Validation
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Check if user exists
    user = USERS.get(email)
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Verify password
    if not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate token
    token = generate_token(email)
    
    # Return user data (without password hash)
    return jsonify({
        'token': token,
        'user': {
            'name': user['name'],
            'email': user['email']
        }
    })

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user information"""
    return jsonify({
        'name': current_user['name'],
        'email': current_user['email']
    })

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    return jsonify(JOBS)

# --- AI Service (OpenAI) ---
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

class AIService:
    @staticmethod
    def extract_text_from_pdf(file_storage):
        from pypdf import PdfReader
        import logging
        
        # Setup logging
        log_dir = os.path.join(os.path.dirname(__file__), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        logging.basicConfig(filename=os.path.join(log_dir, 'pdf_parse.log'), level=logging.INFO)
        
        try:
            reader = PdfReader(file_storage)
            text = ""
            for i, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                    else:
                        logging.warning(f"Page {i} extraction returned None")
                except Exception as e:
                    logging.error(f"Failed to extract text from page {i}: {str(e)}")
                    continue
            
            # Log the first 500 characters of the extracted text
            logging.info(f"--- New PDF Parsed at {datetime.utcnow()} ---")
            logging.info(f"Extracted Text Preview: {text[:]}...")
            
            return text
        except Exception as e:
            logging.error(f"Critical PDF parsing error: {str(e)}")
            raise ValueError(f"Failed to parse PDF file: {str(e)}")

    @staticmethod
    def scrub_pii(text):
        """Remove emails and phone numbers from text"""
        import re
        
        # Email regex
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        text = re.sub(email_pattern, '[REDACTED_EMAIL]', text)
        
        # Phone regex (simple version for international/local formats)
        # Matches patterns like +421 900 000 000, 0900 000 000, 0900-000-000
        phone_pattern = r'\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{3,4}\b'
        text = re.sub(phone_pattern, '[REDACTED_PHONE]', text)
        
        return text

    @staticmethod
    def analyze_cv(text):
        import logging
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found. Please add your API key to backend/.env file")

        # Scrub PII before sending to AI
        scrubbed_text = AIService.scrub_pii(text)
        
        # Log scrubbed text usage
        logging.info(f"Sending scrubbed text to AI (Length: {len(scrubbed_text)})")

        client = OpenAI(api_key=api_key)
        
        system_prompt = """
        You are an expert HR AI and Career Coach for the "MagentaShift" platform. 
        Your goal is to analyze a candidate's CV and extract a structured RPG-style skill profile.
        
        You must:
        1. Calculate a "Creativity Score" (0.0-1.0) based on the uniqueness of their background, presentation, and language used.
        2. Assign an "RPG Class" (e.g., "Code Wizard", "Data Alchemist", "Corporate Paladin", "Agile Bard", "Digital Strategist") based on their dominant skills.
        3. Identify "Meta Skills" (high-level traits like "Leadership", "Adaptability", "Strategic Thinking").
        4. Extract a COMPREHENSIVE list of skills (aim for 20-30 skills) to populate a rich skill tree.
        
        For each skill, provide:
           - A unique ID (use format: skill_<lowercase_name_with_underscores>)
           - Name: The display name of the skill (in English)
           - Type: "technical", "soft", "domain", or "tool"
           - Category: EXACTLY ONE OF: "Code", "Data", "Social", "Business", "Design"
           - Level: "basic", "intermediate", or "advanced" based on evidence
           - Transferability Score (0.0-1.0): How applicable this skill is across different roles
           - Evidence: Direct snippets from the CV that demonstrate this skill
           - Reasoning: A brief explanation (1 sentence) of why this skill was extracted and its relevance.
           - YearsOfExperience: Estimated years of experience with this skill (e.g., "2 years", "5+ years", "Unknown").
           - ConnectionToPreviousJobs: Mention which role/company this skill was primarily used in (e.g., "Used as Backend Dev at Google").
        
        IMPORTANT RULES:
        - Analyze CVs in ANY language (German, French, Spanish, Slovak, etc.) but ALWAYS output the skill names, reasoning, and descriptions in ENGLISH.
        - Categories:
            - "Code": Programming languages, frameworks, dev tools (e.g., Python, React, Git, AWS)
            - "Data": SQL, Excel, Analytics, Visualization, Machine Learning (e.g., Tableau, Pandas)
            - "Social": Communication, Leadership, Teamwork, Agile, Scrum
            - "Business": Finance, Marketing, Strategy, Project Management, Sales
            - "Design": UI/UX, Figma, Photoshop, Creative Writing
        
        Output strictly valid JSON with this exact schema:
        {
            "skills": [
                {
                    "id": "skill_python",
                    "name": "Python",
                    "type": "technical",
                    "category": "Code",
                    "level": "advanced",
                    "transferabilityScore": 0.65,
                    "evidence": [{"snippet": "5 years of Python development experience"}],
                    "reasoning": "Candidate has extensive experience building backend systems with Python.",
                    "yearsOfExperience": "5 years",
                    "connectionToPreviousJobs": "Senior Developer at TechCorp"
                }
            ],
            "creativityScore": 0.75,
            "rpgClass": "Code Wizard",
            "metaSkills": ["Problem Solving", "Team Collaboration"]
        }
        """
        
        user_content = f"CV Text:\n{scrubbed_text}\n"

        try:
            response = client.chat.completions.create(
                model="gpt-4o", # Using GPT-4 for best results
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0.7 # Allow some creativity in skill extraction
            )
            
            result_content = response.choices[0].message.content
            
            # Log the AI response
            logging.info(f"AI Response: {result_content}")
            
            result = json.loads(result_content)
            
            # Validate that we have the required fields
            if not all(k in result for k in ["skills", "creativityScore", "rpgClass", "metaSkills"]):
                raise ValueError("AI response missing required fields")
            
            return result
        except Exception as e:
            logging.error(f"OpenAI Error: {e}")
            print(f"OpenAI Error: {e}")
            raise ValueError(f"Failed to analyze CV with AI: {str(e)}")

@app.route('/api/candidate/parse', methods=['POST'])
def parse_candidate():
    # Check if file is present
    cv_text = ""
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            try:
                cv_text = AIService.extract_text_from_pdf(file)
            except Exception as e:
                return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 400
    else:
        # Fallback to JSON body if no file
        data = request.form if request.form else request.json
        cv_text = data.get('cvText', '')
    
    if not cv_text:
        return jsonify({"error": "No CV text or file provided"}), 400

    try:
        analysis = AIService.analyze_cv(cv_text)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Unexpected error during analysis: {str(e)}"}), 500
            
    candidate_id = str(uuid.uuid4())
    profile = {
        "candidateId": candidate_id,
        "summary": f"Level {len(analysis['skills'])} {analysis['rpgClass']}",
        "skills": analysis['skills'],
        "metaSkills": analysis['metaSkills'],
        "creativityScore": analysis['creativityScore'],
        "rpgClass": analysis['rpgClass']
    }
    
    CANDIDATES[candidate_id] = profile
    return jsonify(profile)


@app.route('/api/candidate/builds', methods=['POST'])
def create_builds():
    data = request.json
    candidate_profile = data.get('candidateProfile')
    job_ids = data.get('jobIds', [])
    
    if not candidate_profile:
        return jsonify({"error": "Missing candidate profile"}), 400
        
    candidate_id = candidate_profile.get('candidateId')
    candidate_skills = candidate_profile.get('skills', [])
    
    # Create a mapping by both ID and name for flexible matching
    candidate_skills_by_id = {s['id']: s for s in candidate_skills}
    candidate_skills_by_name = {s['name'].lower(): s for s in candidate_skills}
    
    builds = []
    
    for job in JOBS:
        if job_ids and job['jobId'] not in job_ids:
            continue
            
        job_skills = job.get('skillsRequired', [])
        covered_skills = []
        missing_skills = []
        
        match_count = 0
        total_critical = 0
        covered_critical = 0
        
        for req_skill in job_skills:
            is_critical = req_skill.get('importance') == 'critical'
            if is_critical:
                total_critical += 1
            
            # Try to match by ID first, then by name (case-insensitive)
            matched_skill = None
            if req_skill['id'] in candidate_skills_by_id:
                matched_skill = candidate_skills_by_id[req_skill['id']]
            elif req_skill['name'].lower() in candidate_skills_by_name:
                matched_skill = candidate_skills_by_name[req_skill['name'].lower()]
            
            if matched_skill:
                match_count += 1
                if is_critical:
                    covered_critical += 1
                covered_skills.append({
                    "jobSkillId": req_skill['id'],
                    "name": req_skill['name'],
                    "sourceSkillIds": [matched_skill['id']],
                    "explanation": f"Matched {req_skill['name']} (Level: {matched_skill.get('level', 'N/A')})",
                    "category": matched_skill.get('category', 'Other')
                })
            else:
                missing_skills.append({
                    "jobSkillId": req_skill['id'],
                    "name": req_skill['name'],
                    "importance": req_skill['importance']
                })
        
        # Simple score calculation
        total_skills = len(job_skills)
        match_score = match_count / total_skills if total_skills > 0 else 0
        
        # Generate quests for missing skills
        quests = []
        gap_cost = 0
        for missing in missing_skills:
            hours = 10 if missing['importance'] == 'critical' else 5
            gap_cost += hours
            quests.append({
                "id": f"quest_{missing['jobSkillId']}",
                "title": f"Learn {missing['name']}",
                "description": f"Complete a course or project to demonstrate {missing['name']}.",
                "estimatedHours": hours
            })
            
        build = {
            "jobId": job['jobId'],
            "jobTitle": job['title'],
            "matchScore": round(match_score, 2),
            "gapCostHours": gap_cost,
            "coveredSkills": covered_skills,
            "missingSkills": missing_skills,
            "quests": quests
        }
        builds.append(build)
        
        # Create/Update Avatar for Recruiter View
        # In a real app, this might be separate, but for hackathon we can do it here
        if job['jobId'] not in AVATARS:
            AVATARS[job['jobId']] = []
            
        # Check if avatar already exists for this candidate/job combo
        existing_avatar = next((a for a in AVATARS[job['jobId']] if a['candidateId'] == candidate_id), None)
        
        avatar = {
            "avatarId": existing_avatar['avatarId'] if existing_avatar else str(uuid.uuid4()),
            "candidateId": candidate_id,
            "matchScore": round(match_score, 2),
            "gapCostHours": gap_cost,
            "summary": f"Match for {job['title']}",
            "primaryBranch": "General", # Placeholder
            "skillCoverage": {
                "criticalCovered": covered_critical,
                "criticalTotal": total_critical,
                "overallCovered": match_count,
                "overallTotal": total_skills
            }
        }
        
        if existing_avatar:
             AVATARS[job['jobId']] = [a for a in AVATARS[job['jobId']] if a['avatarId'] != avatar['avatarId']]
             
        AVATARS[job['jobId']].append(avatar)

    response = {
        "candidateId": candidate_id,
        "baseProfile": candidate_profile,
        "builds": builds
    }
    
    BUILDS[candidate_id] = response
    return jsonify(response)

@app.route('/api/recruiter/avatars/<jobId>', methods=['GET'])
def get_avatars(jobId):
    return jsonify({"jobId": jobId, "avatars": AVATARS.get(jobId, [])})

@app.route('/api/recruiter/avatar/<avatarId>', methods=['GET'])
def get_avatar_detail(avatarId):
    # Find the avatar across all jobs
    found_avatar = None
    found_job_id = None
    
    for job_id, avatars in AVATARS.items():
        for av in avatars:
            if av['avatarId'] == avatarId:
                found_avatar = av
                found_job_id = job_id
                break
        if found_avatar:
            break
            
    if not found_avatar:
        return jsonify({"error": "Avatar not found"}), 404
        
    # Reconstruct the tree view (simplified for now)
    # We need to get the build info again or store it better. 
    # For now, let's re-calculate or retrieve from BUILDS if we have candidateId
    
    candidate_id = found_avatar['candidateId']
    candidate_builds = BUILDS.get(candidate_id, {}).get('builds', [])
    target_build = next((b for b in candidate_builds if b['jobId'] == found_job_id), None)
    
    nodes = []
    edges = []
    
    if target_build:
        for covered in target_build['coveredSkills']:
             nodes.append({
                 "id": covered['jobSkillId'],
                 "name": covered['jobSkillId'], # Should map back to name
                 "type": "technical", # Placeholder
                 "status": "covered",
                 "importance": "high", # Placeholder
                 "evidence": [{"snippet": covered['explanation']}]
             })
             
        for missing in target_build['missingSkills']:
            nodes.append({
                "id": missing['jobSkillId'],
                "name": missing['name'],
                "type": "technical", # Placeholder
                "status": "missing",
                "importance": missing['importance'],
                "evidence": []
            })
            
    return jsonify({
        "avatarId": avatarId,
        "jobId": found_job_id,
        "tree": {
            "nodes": nodes,
            "edges": edges
        },
        "quests": target_build['quests'] if target_build else []
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
