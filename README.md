# ADHDecode

Intelligent Adult ADHD Likelihood Screening Platform

ADHDecode is a behavioral + questionnaire-based web application designed to estimate the likelihood of ADHD traits in adults using structured self-report measures and real-time cognitive micro-tasks.

It combines psychometric screening with measurable behavioral signals to generate a structured, explainable likelihood score.

⚠️ ADHDecode is a screening and awareness tool. It is not a medical diagnosis and does not replace professional clinical evaluation.

🌍 Vision

ADHDecode aims to bridge the gap between:

Subjective symptom reporting

Objective behavioral measurement

Accessible early awareness tools

By integrating cognitive testing with structured scoring, ADHDecode moves beyond questionnaire-only screening.

🏗 Product Flow
User Login / Guest Mode
        ↓
Informed Consent
        ↓
Demographics & Contextual Data
        ↓
Screening Selection
   • Quick Check
   • Moderate Check
   • Detailed Check
        ↓
Behavioral Cognitive Tasks
   • Time Perception Challenge
   • Reaction Time Test
        ↓
Scoring Engine
        ↓
Likelihood Report + Subscale Insights

🔐 Authentication

Users may:

Create an account (for longitudinal tracking)

Continue in Guest Mode (session-based only)

Guest data is not persistently stored.

📜 Informed Consent

Users must:

Confirm age ≥ 18

Acknowledge non-diagnostic nature

Accept data transparency terms

👤 Demographics & Context Collection

Minimal contextual variables are collected to improve interpretability:

Age group

Gender (optional)

Education level

Employment status

Prior ADHD diagnosis (Yes / No / Unsure)

Sleep quality

Caffeine intake

Current medication (optional)

These variables inform contextual adjustment but do not determine outcome.

🧪 Screening Modules
1️⃣ Symptom Screening

Three selectable modes:

🔹 Quick Check

Fast screening covering core ADHD domains.

🔹 Moderate Check

Expanded coverage:

Inattention

Hyperactivity

Impulsivity

Executive function

🔹 Detailed Check

Comprehensive screening aligned conceptually with DSM-5 criteria (screening-level only).

Scoring Method

Likert-scale responses

Domain-level subscales

Weighted composite score

🧠 Behavioral Cognitive Modules
⏳ Time Perception Challenge
Purpose

Measures internal time estimation accuracy and variability.

Task Structure

User produces target intervals (e.g., 3s, 6s, 10s, 15s)

Multiple repeated trials

Captured Metrics

Per trial:

Target duration

Produced duration

Absolute error

Signed bias

Aggregate:

Mean absolute error

Variability (SD)

Performance drift

Higher variability may indicate attention instability.

⚡ Reaction Time Test
Purpose

Measures response speed, attention stability, and impulsivity patterns.

Task Structure

Random delay (1–4s)

Visual stimulus

User responds as quickly as possible

Captured Metrics

Per trial:

Reaction time (ms)

Premature response

Missed response

Aggregate:

Median reaction time

Reaction time variability

Error rate

Percentile dispersion

Reaction time variability is often more informative than raw speed.

🧮 Scoring Engine

The final ADHD Likelihood Score integrates multi-dimensional inputs.

Weighted Framework
Component	Weight
Symptom Screening	50–60%
Reaction Time Variability & Errors	20–25%
Time Perception Variability	15–20%
Contextual Adjustment	Dynamic
Scoring Logic (Conceptual)

Normalize each component to 0–100 scale

Apply weighted aggregation

Adjust for contextual modifiers

Generate:

Overall likelihood score

Subscale breakdown

Behavioral summary

Output Report

Users receive:

ADHD Likelihood Score (0–100)

Tier classification:

Low

Mild

Moderate

High

Domain-level breakdown

Behavioral variability summary

Clear disclaimer

🏛 Technical Architecture
System Overview
Frontend (HTML/CSS/JS)
        ↓
API Layer (Node.js or Python)
        ↓
Scoring Engine
        ↓
Database (optional persistent storage)
        ↓
Report Generator

Core Components
Frontend

Task rendering

Real-time timers

Stimulus control

Trial-level logging

Backend

Session management

Data validation

Scoring computation

Report generation

Data Layer

Encrypted user IDs

Session logs

Behavioral metrics

Questionnaire responses

🔬 Research & Scientific Positioning

ADHDecode draws conceptual inspiration from:

Adult ADHD Self-Report Scale (ASRS)

Reaction time variability research

Go/No-Go paradigms

Time perception research in ADHD populations

This platform is not affiliated with clinical diagnostic instruments.

🔒 Privacy & Ethics

No sale or sharing of data

Minimal personal identifiers

Transparent data handling

User deletion option (account mode)

ADHDecode prioritizes ethical behavioral data usage.

🚀 Future Roadmap

Go/No-Go inhibition module

Working memory task

Sustained Attention (CPT-style)

Longitudinal tracking dashboard

AI-powered interpretability

Research validation study

🎯 Intended Use

ADHDecode is designed for:

Adult awareness screening

Research prototypes

Digital health innovation

Early-stage cognitive assessment exploration

⚠️ Medical Disclaimer

ADHDecode does not diagnose ADHD.
Results indicate statistical likelihood patterns only.
Users should consult licensed professionals for formal evaluation.

🛠 Tech Stack

Replit Deployment

HTML / CSS / JavaScript

Node.js or Python Backend

Secure session handling

Optional database integration

📄 License & Copyright

© 2026 ADHDecode. All rights reserved.

This software, design, scoring methodology, interface, and documentation are the intellectual property of ADHDecode.
Unauthorized reproduction, redistribution, or commercial use without written permission is strictly prohibited.
