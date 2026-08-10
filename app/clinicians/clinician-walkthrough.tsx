"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Target,
  TrendUp,
} from "@phosphor-icons/react";
import { useState } from "react";

type Stage = "goal" | "feed" | "briefing" | "practice";

const stages: Array<{ id: Stage; label: string }> = [
  { id: "goal", label: "Direction" },
  { id: "feed", label: "Case mix" },
  { id: "briefing", label: "Briefing" },
  { id: "practice", label: "Practice" },
];

const focusAreas = ["Women’s metabolic & reproductive health"];

const cases = [
  { label: "New PCOS assessment", detail: "Cycles · metabolic screen", time: "8:40 am" },
  { label: "PCOS follow-up", detail: "COCP suitability · mood check", time: "10:20 am" },
  { label: "Metformin review", detail: "Titration · GI tolerance", time: "1:10 pm" },
  { label: "Longer PCOS consult", detail: "Symptoms · shared plan", time: "3:40 pm" },
];

const resources = [
  {
    id: "guideline",
    eyebrow: "Current PCOS / PMOS guideline",
    title: "PCOS metabolic management",
    detail: "2023 International Evidence-based Guideline",
    duration: "3 min",
    href: "https://www.monash.edu/__data/assets/pdf_file/0003/3379521/Evidence-Based-Guidelines-2023.pdf",
  },
  {
    id: "diagnosis",
    eyebrow: "Diagnostic refresher",
    title: "Rotterdam criteria + the AMH update",
    detail: "A two-minute pattern check before clinic",
    duration: "2 min",
    href: "https://www.monash.edu/medicine/mchri/pcos/guideline",
  },
  {
    id: "cocp",
    eyebrow: "Safety checklist",
    title: "COCP contraindications",
    detail: "Check against WHO medical eligibility criteria",
    duration: "2 min",
    href: "https://www.who.int/publications/i/item/9789240115583",
  },
  {
    id: "metformin",
    eyebrow: "Treatment guide",
    title: "Metformin: start, titrate, review",
    detail: "Tolerance, dose progression and follow-up prompts",
    duration: "2 min",
    href: "https://www.monash.edu/__data/assets/pdf_file/0003/3379521/Evidence-Based-Guidelines-2023.pdf",
  },
  {
    id: "paper",
    eyebrow: "Latest evidence",
    title: "COMET-PCOS randomised trial",
    detail: "COCP and metformin for metabolic outcomes · 2025",
    duration: "4 min",
    href: "https://pubmed.ncbi.nlm.nih.gov/41359669/",
  },
];

export function ClinicianWalkthrough() {
  const [stage, setStage] = useState<Stage>("goal");
  const [focus, setFocus] = useState(focusAreas[0]!);
  const [target, setTarget] = useState(30);
  const [reviewed, setReviewed] = useState<string[]>(["guideline"]);

  const stageIndex = stages.findIndex((item) => item.id === stage);

  function move(direction: 1 | -1) {
    const next = Math.min(stages.length - 1, Math.max(0, stageIndex + direction));
    setStage(stages[next]!.id);
    window.scrollTo(0, 0);
  }

  function toggleReviewed(id: string) {
    setReviewed((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  function restart() {
    setStage("goal");
    setFocus(focusAreas[0]!);
    setTarget(30);
    setReviewed(["guideline"]);
    window.scrollTo(0, 0);
  }

  return (
    <main className="clinician-app">
      <section className="clinician-shell">
        <header className="clinician-header">
          <div>
            <span className="wordmark">CareYield</span>
            <span className="clinician-product-name">Clinician</span>
          </div>
          <Link href="/" className="quiet-link">Patient view</Link>
        </header>

        <nav className="walkthrough-progress" aria-label="Clinician walkthrough progress">
          {stages.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index <= stageIndex ? "is-reached" : ""}
              aria-current={item.id === stage ? "step" : undefined}
              onClick={() => setStage(item.id)}
            >
              <span>{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {stage === "goal" && (
          <div className="clinician-stage goal-stage">
            <div className="clinician-stage-heading">
              <p className="eyebrow">Shape your practice</p>
              <h1>Build the clinical work you want to get better at.</h1>
              <p>Set a direction. CareYield concentrates appropriate cases and prepares learning around the work arriving next.</p>
            </div>

            <div className="direction-panel">
              <div className="direction-label">
                <span>Clinical direction</span>
                <Target size={20} weight="light" aria-hidden="true" />
              </div>
              <div className="focus-options" aria-label="Clinical focus">
                {focusAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className={focus === area ? "selected" : ""}
                    aria-pressed={focus === area}
                    onClick={() => setFocus(area)}
                  >
                    <span>{area}</span>
                    {focus === area && <Check size={18} weight="bold" aria-hidden="true" />}
                  </button>
                ))}
              </div>

              <div className="target-control">
                <div>
                  <label htmlFor="focus-target">Target practice mix</label>
                  <strong>{target}%</strong>
                </div>
                <input
                  id="focus-target"
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={target}
                  onChange={(event) => setTarget(Number(event.target.value))}
                />
                <div className="range-labels" aria-hidden="true"><span>10%</span><span>50%</span></div>
              </div>
            </div>

            <div className="clinician-stage-action">
              <button className="primary-button" type="button" onClick={() => move(1)}>
                Create my pathway <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </button>
              <p>Demo pathway only. It does not determine scope or credentialing.</p>
            </div>
          </div>
        )}

        {stage === "feed" && (
          <div className="clinician-stage feed-stage">
            <button className="stage-back" type="button" onClick={() => move(-1)}><ArrowLeft size={18} /> Direction</button>
            <div className="clinician-stage-heading">
              <p className="eyebrow">Your pathway is active</p>
              <h1>{target}% of your work is moving toward {focus.toLowerCase()}.</h1>
            </div>

            <div className="feed-summary">
              <div><span>This week</span><strong>9 matched cases</strong></div>
              <div><span>Tomorrow</span><strong>4 PCOS appointments</strong></div>
            </div>

            <section className="tomorrow-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Tomorrow · Fitzroy clinic</p><h2>Your concentrated case mix</h2></div>
                <Clock size={22} weight="light" aria-hidden="true" />
              </div>
              <div className="case-list">
                {cases.map((item) => (
                  <div key={item.time} className="case-row">
                    <time>{item.time}</time>
                    <div><strong>{item.label}</strong><span>{item.detail}</span></div>
                  </div>
                ))}
              </div>
            </section>

            <div className="clinician-stage-action inline-action">
              <button className="primary-button" type="button" onClick={() => move(1)}>
                Open tomorrow’s briefing <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </button>
              <p>Case summaries are synthetic and contain no identifying details.</p>
            </div>
          </div>
        )}

        {stage === "briefing" && (
          <div className="clinician-stage briefing-stage">
            <button className="stage-back" type="button" onClick={() => move(-1)}><ArrowLeft size={18} /> Case mix</button>
            <div className="clinician-stage-heading briefing-heading">
              <p className="eyebrow">Tomorrow · 4 PCOS cases</p>
              <h1>Your case-specific learning stream.</h1>
              <p>Five small prompts, sequenced around the decisions likely to arise tomorrow.</p>
            </div>

            <div className="resource-list">
              {resources.map((resource) => {
                const isReviewed = reviewed.includes(resource.id);
                return (
                  <article key={resource.id} className={`resource-row${isReviewed ? " is-reviewed" : ""}`}>
                    <button type="button" onClick={() => toggleReviewed(resource.id)} aria-pressed={isReviewed} aria-label={`${isReviewed ? "Mark unread" : "Mark reviewed"}: ${resource.title}`}>
                      <span className="resource-check">{isReviewed && <Check size={15} weight="bold" aria-hidden="true" />}</span>
                    </button>
                    <div>
                      <span className="resource-eyebrow">{resource.eyebrow}</span>
                      <strong>{resource.title}</strong>
                      <small>{resource.detail}</small>
                    </div>
                    <div className="resource-meta">
                      <span>{resource.duration}</span>
                      <a href={resource.href} target="_blank" rel="noreferrer" aria-label={`Open source for ${resource.title}`}>
                        <ArrowUpRight size={18} weight="light" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="briefing-footer">
              <span><BookOpen size={18} weight="light" aria-hidden="true" /> {reviewed.length} of {resources.length} reviewed</span>
              <button type="button" onClick={() => move(1)}>See the longer arc <ArrowRight size={17} weight="bold" aria-hidden="true" /></button>
            </div>
          </div>
        )}

        {stage === "practice" && (
          <div className="clinician-stage practice-stage">
            <button className="stage-back" type="button" onClick={() => move(-1)}><ArrowLeft size={18} /> Briefing</button>
            <div className="clinician-stage-heading">
              <p className="eyebrow">The practice flywheel</p>
              <h1>Concentrated cases turn learning into repeated practice.</h1>
              <p>Each week pairs relevant exposure with small, deliberate learning moments tied to the work in front of you.</p>
            </div>

            <div className="practice-metrics">
              <div><span>Focused cases</span><strong>184</strong></div>
              <div><span>Briefings reviewed</span><strong>46</strong></div>
              <div><span>Current focus mix</span><strong>31%</strong></div>
            </div>

            <div className="practice-loop">
              <div><span>1</span><div><strong>Choose a direction</strong><p>Make the desired clinical mix explicit.</p></div></div>
              <div><span>2</span><div><strong>Concentrate appropriate cases</strong><p>See enough similar presentations to recognise patterns.</p></div></div>
              <div><span>3</span><div><strong>Learn against tomorrow’s work</strong><p>Review only what is relevant to the decisions ahead.</p></div></div>
              <div><span>4</span><div><strong>Repeat, reflect, refine</strong><p>Case volume and deliberate learning compound together.</p></div></div>
            </div>

            <div className="skin-cancer-note">
              <TrendUp size={24} weight="light" aria-hidden="true" />
              <p>The operating idea mirrors focused skin-cancer general practice: concentrated exposure, repeat pattern recognition and deliberate learning.</p>
            </div>

            <div className="clinician-stage-action inline-action">
              <button className="primary-button" type="button" onClick={restart}>Restart walkthrough</button>
              <p>Exposure and learning activity are not a credential or competence score.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
