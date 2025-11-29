from app import app, db, Job, JobSkill
import json
import os

def seed_jobs():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'jobs.json')
    
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    with open(data_path, 'r') as f:
        jobs_data = json.load(f)

    with app.app_context():
        # Clear existing jobs to avoid duplicates
        print("Clearing existing jobs...")
        JobSkill.query.delete()
        Job.query.delete()
        
        print(f"Seeding {len(jobs_data)} jobs...")
        for job_data in jobs_data:
            job = Job(
                job_id=job_data['jobId'],
                title=job_data['title'],
                domain=job_data.get('domain', ''),
                description=job_data.get('description', '')
            )
            db.session.add(job)
            db.session.flush() # Flush to get job.id
            
            for skill_data in job_data.get('skillsRequired', []):
                skill = JobSkill(
                    job_id=job.id,
                    skill_id=skill_data['id'],
                    name=skill_data['name'],
                    type=skill_data.get('type', 'technical'),
                    importance=skill_data.get('importance', 'medium')
                )
                db.session.add(skill)
        
        db.session.commit()
        print("Jobs seeded successfully!")

if __name__ == '__main__':
    seed_jobs()
