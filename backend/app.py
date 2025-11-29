from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
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

# Database Configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(DATA_DIR, "magenta.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database Models ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(50), unique=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to profile
    profile = db.relationship('CandidateProfile', backref='user', uselist=False)

class CandidateProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=True)
    candidate_id = db.Column(db.String(50), unique=True, nullable=False) # UUID for frontend ref
    rpg_class = db.Column(db.String(50))
    creativity_score = db.Column(db.Float)
    summary = db.Column(db.String(200))
    skills_json = db.Column(db.Text) # Stored as JSON string
    meta_skills_json = db.Column(db.Text) # Stored as JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    domain = db.Column(db.String(50))
    description = db.Column(db.String(500))
    
    # Relationship
    skills_required = db.relationship('JobSkill', backref='job', lazy=True, cascade="all, delete-orphan")

class JobSkill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    skill_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50)) # technical, soft
    importance = db.Column(db.String(20)) # critical, high, medium

# Create tables
with app.app_context():
    db.create_all()

# Data Storage (Persistent for Users/Candidates/Jobs)
# AVATARS cache (could be moved to DB later, but keeping simple for now)
AVATARS = {} 

# Removed load_jobs and save_jobs as we now use DB

# --- Authentication Helper Functions ---
def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, hashed):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(public_id):
    """Generate a JWT token for a user"""
    payload = {
        'public_id': public_id,
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
            current_user = User.query.filter_by(public_id=data['public_id']).first()
            
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
                
        except Exception as e:
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
    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists with this email'}), 400
    
    # Create new user
    hashed_pw = hash_password(password)
    new_user = User(
        public_id=str(uuid.uuid4()),
        name=name,
        email=email,
        password_hash=hashed_pw
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Generate token
    token = generate_token(new_user.public_id)
    
    # Return user data (without password hash)
    return jsonify({
        'token': token,
        'user': {
            'name': new_user.name,
            'email': new_user.email
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
    user = User.query.filter_by(email=email).first()
    
    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate token
    token = generate_token(user.public_id)
    
    # Return user data (without password hash)
    return jsonify({
        'token': token,
        'user': {
            'name': user.name,
            'email': user.email
        }
    })

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user information"""
    return jsonify({
        'name': current_user.name,
        'email': current_user.email
    })

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    jobs = Job.query.all()
    result = []
    for job in jobs:
        skills = []
        for s in job.skills_required:
            skills.append({
                "id": s.skill_id,
                "name": s.name,
                "type": s.type,
                "importance": s.importance
            })
        result.append({
            "jobId": job.job_id,
            "title": job.title,
            "domain": job.domain,
            "description": job.description,
            "skillsRequired": skills
        })
    return jsonify(result)

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
# @token_required # Ideally we require token, but for now we might handle anonymous uploads or check header manually
def parse_candidate():
    # Check for token manually to associate with user if logged in
    current_user = None
    token = request.headers.get('Authorization')
    if token:
        try:
            if token.startswith('Bearer '): token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(public_id=data['public_id']).first()
        except:
            pass # Proceed as anonymous if token invalid (or return error if we want strict auth)

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
        data = request.form if request.form else request.json
        cv_text = data.get('cvText', '')
    
    linkedin_url = request.form.get('linkedinUrl') if request.form else (request.json.get('linkedinUrl') if request.json else None)
    
    if not cv_text and not linkedin_url:
        return jsonify({"error": "No CV text, file, or LinkedIn URL provided"}), 400

    try:
        # If we have a user, check if they already have a profile to update
        # For now, we just re-analyze. In a real app, maybe we just update parts.
        analysis = AIService.analyze_cv(cv_text) # Pass linkedin_url if implemented in AIService
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Unexpected error during analysis: {str(e)}"}), 500
            
    # Save/Update Profile in DB
    candidate_id = str(uuid.uuid4())
    
    if current_user:
        profile = CandidateProfile.query.filter_by(user_id=current_user.id).first()
        if profile:
            # Update existing
            profile.rpg_class = analysis['rpgClass']
            profile.creativity_score = analysis['creativityScore']
            profile.skills_json = json.dumps(analysis['skills'])
            profile.meta_skills_json = json.dumps(analysis['metaSkills'])
            profile.summary = f"Level {len(analysis['skills'])} {analysis['rpgClass']}"
            candidate_id = profile.candidate_id # Keep existing ID
        else:
            # Create new linked to user
            profile = CandidateProfile(
                user_id=current_user.id,
                candidate_id=candidate_id,
                rpg_class=analysis['rpgClass'],
                creativity_score=analysis['creativityScore'],
                skills_json=json.dumps(analysis['skills']),
                meta_skills_json=json.dumps(analysis['metaSkills']),
                summary=f"Level {len(analysis['skills'])} {analysis['rpgClass']}"
            )
            db.session.add(profile)
    else:
        # Anonymous - Create new unlinked profile
        profile = CandidateProfile(
            user_id=None,
            candidate_id=candidate_id,
            rpg_class=analysis['rpgClass'],
            creativity_score=analysis['creativityScore'],
            skills_json=json.dumps(analysis['skills']),
            meta_skills_json=json.dumps(analysis['metaSkills']),
            summary=f"Level {len(analysis['skills'])} {analysis['rpgClass']}"
        )
        db.session.add(profile)
    
    db.session.commit()
    
    # Return the profile structure expected by frontend
    return jsonify({
        "candidateId": candidate_id,
        "summary": f"Level {len(analysis['skills'])} {analysis['rpgClass']}",
        "skills": analysis['skills'],
        "metaSkills": analysis['metaSkills'],
        "creativityScore": analysis['creativityScore'],
        "rpgClass": analysis['rpgClass']
    })


def calculate_build(candidate_profile, job):
    """Helper to calculate match score, skills, and quests for a candidate and job (SQLAlchemy object)"""
    candidate_skills = candidate_profile.get('skills', [])
    
    # Create a mapping by both ID and name for flexible matching
    candidate_skills_by_id = {s['id']: s for s in candidate_skills}
    candidate_skills_by_name = {s['name'].lower(): s for s in candidate_skills}
    
    job_skills = job.skills_required # SQLAlchemy relationship
    covered_skills = []
    missing_skills = []
    
    match_count = 0
    total_critical = 0
    covered_critical = 0
    
    for req_skill in job_skills:
        is_critical = req_skill.importance == 'critical'
        if is_critical:
            total_critical += 1
        
        # Try to match by ID first, then by name (case-insensitive)
        matched_skill = None
        if req_skill.skill_id in candidate_skills_by_id:
            matched_skill = candidate_skills_by_id[req_skill.skill_id]
        elif req_skill.name.lower() in candidate_skills_by_name:
            matched_skill = candidate_skills_by_name[req_skill.name.lower()]
        
        if matched_skill:
            match_count += 1
            if is_critical:
                covered_critical += 1
            covered_skills.append({
                "jobSkillId": req_skill.skill_id,
                "name": req_skill.name,
                "sourceSkillIds": [matched_skill['id']],
                "explanation": f"Matched {req_skill.name} (Level: {matched_skill.get('level', 'N/A')})",
                "category": matched_skill.get('category', 'Other')
            })
        else:
            missing_skills.append({
                "jobSkillId": req_skill.skill_id,
                "name": req_skill.name,
                "importance": req_skill.importance
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
        
    return {
        "jobId": job.job_id,
        "jobTitle": job.title,
        "matchScore": round(match_score, 2),
        "gapCostHours": gap_cost,
        "coveredSkills": covered_skills,
        "missingSkills": missing_skills,
        "quests": quests,
        "skillCoverage": {
            "criticalCovered": covered_critical,
            "criticalTotal": total_critical,
            "overallCovered": match_count,
            "overallTotal": total_skills
        }
    }

@app.route('/api/candidate/builds', methods=['POST'])
def create_builds():
    data = request.json
    candidate_profile = data.get('candidateProfile')
    job_ids = data.get('jobIds', [])
    
    if not candidate_profile:
        return jsonify({"error": "Missing candidate profile"}), 400
        
    candidate_id = candidate_profile.get('candidateId')
    
    builds = []
    
    # Fetch jobs from DB
    all_jobs = Job.query.all()
    
    for job in all_jobs:
        if job_ids and job.job_id not in job_ids:
            continue
            
        build_data = calculate_build(candidate_profile, job)
        
        # Prepare build object for response (exclude internal stats if needed, but keeping for now)
        build = {k: v for k, v in build_data.items() if k != 'skillCoverage'}
        builds.append(build)
        
        # Update AVATARS list (Recruiter View)
        if job.job_id not in AVATARS:
            AVATARS[job.job_id] = []
            
        # Remove existing avatar for this candidate if present
        AVATARS[job.job_id] = [a for a in AVATARS[job.job_id] if a['candidateId'] != candidate_id]
        
        avatar = {
            "avatarId": str(uuid.uuid4()), # New ID for the avatar view
            "candidateId": candidate_id,
            "matchScore": build_data['matchScore'],
            "gapCostHours": build_data['gapCostHours'],
            "summary": f"Match for {job.title}",
            "primaryBranch": "General",
            "skillCoverage": build_data['skillCoverage']
        }
        AVATARS[job.job_id].append(avatar)

    response = {
        "candidateId": candidate_id,
        "baseProfile": candidate_profile,
        "builds": builds
    }
    
    return jsonify(response)

@app.route('/api/recruiter/avatars/<jobId>', methods=['GET'])
def get_avatars(jobId):
    # Ensure AVATARS are populated from DB if empty
    if jobId not in AVATARS or not AVATARS[jobId]:
        AVATARS[jobId] = []
        profiles = CandidateProfile.query.all()
        job = Job.query.filter_by(job_id=jobId).first()
        
        if job:
            for profile_record in profiles:
                # Reconstruct profile
                candidate_profile = {
                    "candidateId": profile_record.candidate_id,
                    "skills": json.loads(profile_record.skills_json),
                    "rpgClass": profile_record.rpg_class
                }
                
                # Calculate build
                build_data = calculate_build(candidate_profile, job)
                
                avatar = {
                    "avatarId": str(uuid.uuid4()),
                    "candidateId": profile_record.candidate_id,
                    "matchScore": build_data['matchScore'],
                    "gapCostHours": build_data['gapCostHours'],
                    "summary": f"Match for {job.title}",
                    "primaryBranch": "General",
                    "skillCoverage": build_data['skillCoverage']
                }
                AVATARS[jobId].append(avatar)

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
        
    # Reconstruct the build data from DB
    candidate_id = found_avatar['candidateId']
    profile_record = CandidateProfile.query.filter_by(candidate_id=candidate_id).first()
    
    if not profile_record:
        return jsonify({"error": "Candidate profile not found"}), 404
        
    # Re-construct profile object
    candidate_profile = {
        "candidateId": profile_record.candidate_id,
        "skills": json.loads(profile_record.skills_json),
        "rpgClass": profile_record.rpg_class
    }
    
    # Find the job
    job = Job.query.filter_by(job_id=found_job_id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404
        
    # Calculate full build details
    build_data = calculate_build(candidate_profile, job)
    
    nodes = []
    edges = []
    
    # Build Tree Nodes
    for covered in build_data['coveredSkills']:
            nodes.append({
                "id": covered['jobSkillId'],
                "name": covered['name'], 
                "type": "technical", # Placeholder
                "status": "covered",
                "importance": "high", # Placeholder
                "evidence": [{"snippet": covered['explanation']}]
            })
            
    for missing in build_data['missingSkills']:
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
        "quests": build_data['quests']
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
