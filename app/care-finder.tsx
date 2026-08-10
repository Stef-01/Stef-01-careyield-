"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  CaretLeft,
  CaretRight,
  List,
  Microphone,
  PencilSimple,
  Waveform,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clinicians, rankClinicians, type Clinician } from "@/demo/clinicians";

type Stage =
  | "welcome"
  | "listening"
  | "type"
  | "review"
  | "matching"
  | "match"
  | "all"
  | "profile"
  | "booking"
  | "confirmed";

const exampleRequest =
  "I’m a young South Indian woman navigating PCOS and a difficult time with my mental health. I’d like a woman GP who understands the cultural and family side too.";
const exampleHeadline =
  "PCOS, cultural and mental-health care.";

function getRequestHeadline(value: string, fallback: string) {
  const words = value.toLowerCase();
  const hasPcos = words.includes("pcos") || words.includes("polycystic");
  const hasCulturalContext = ["south indian", "indian", "tamil", "malayalam", "culture", "cultural"].some((term) =>
    words.includes(term),
  );

  return hasPcos && hasCulturalContext ? exampleHeadline : fallback;
}

function getRequestPriorities(value: string) {
  const words = value.toLowerCase();
  const priorities = [
    { label: "PCOS expertise", terms: ["pcos", "polycystic"] },
    { label: "Woman GP", terms: ["woman", "women", "female"] },
    { label: "Mental-health care", terms: ["mental health", "emotion", "anxiety", "mood", "psychological"] },
    { label: "South Indian context", terms: ["south indian", "tamil", "malayalam"] },
    { label: "Cultural understanding", terms: ["indian", "culture", "cultural", "family"] },
    { label: "Longer conversations", terms: ["time", "unhurried", "longer", "explain"] },
  ];

  return priorities
    .filter((priority) => priority.terms.some((term) => words.includes(term)))
    .map((priority) => priority.label)
    .slice(0, 5);
}

function Wordmark() {
  return <span className="wordmark">CareYield</span>;
}

function WaveformMark({ active = false }: { active?: boolean }) {
  return (
    <span className={`waveform-mark${active ? " is-active" : ""}`} aria-hidden="true">
      <Waveform size={88} weight="light" />
    </span>
  );
}

export function CareFinder() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [draft, setDraft] = useState("");
  const [request, setRequest] = useState(exampleRequest);
  const [matches, setMatches] = useState(() => rankClinicians(exampleRequest));
  const [matchIndex, setMatchIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const swipeStart = useRef<number | null>(null);

  const clinician = matches[matchIndex] ?? clinicians[0]!;

  useEffect(() => {
    if (stage !== "listening") return;
    const timer = window.setInterval(() => setElapsed((value) => Math.min(value + 1, 20)), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "matching") return;
    const timer = window.setTimeout(() => setStage("match"), 850);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  const requestSummary = useMemo(() => {
    const cleaned = request.trim().replace(/[.!?]+$/, "");
    if (!cleaned) return exampleRequest;
    return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}.`;
  }, [request]);
  const requestHeadline = useMemo(
    () => getRequestHeadline(request, requestSummary),
    [request, requestSummary],
  );
  const requestPriorities = useMemo(() => getRequestPriorities(request), [request]);

  function startListening() {
    setElapsed(0);
    setStage("listening");
  }

  function finishListening() {
    setRequest(exampleRequest);
    setDraft(exampleRequest);
    setStage("review");
  }

  function findMatches(value = request) {
    const nextRequest = value.trim() || exampleRequest;
    setRequest(nextRequest);
    setMatches(rankClinicians(nextRequest));
    setMatchIndex(0);
    setStage("matching");
  }

  function moveMatch(direction: 1 | -1) {
    setMatchIndex((current) => (current + direction + matches.length) % matches.length);
  }

  function chooseClinician(selected: Clinician, destination: "match" | "profile" = "profile") {
    const index = matches.findIndex((item) => item.id === selected.id);
    if (index >= 0) setMatchIndex(index);
    setStage(destination);
  }

  function reset() {
    setStage("welcome");
    setDraft("");
    setRequest(exampleRequest);
    setMatches(rankClinicians(exampleRequest));
    setMatchIndex(0);
    setSelectedTime("");
  }

  return (
    <main className="care-app">
      <section className="care-shell" aria-live="polite">
        {stage === "welcome" && (
          <div className="screen voice-screen">
            <header className="minimal-header">
              <Wordmark />
              <Link href="/clinicians" className="quiet-link">Clinician view</Link>
            </header>

            <div className="voice-prompt">
              <p className="eyebrow">Find your fit</p>
              <h1>Who would you feel comfortable seeing?</h1>
              <p className="example">Try: “I’m a young South Indian woman navigating PCOS and a difficult time with my mental health. I’d like a woman GP who understands the cultural side too.”</p>
            </div>

            <div className="voice-actions">
              <button className="mic-button" type="button" onClick={startListening} aria-label="Start voice description">
                <Microphone size={38} weight="light" aria-hidden="true" />
              </button>
              <p>Talk for about 20 seconds</p>
              <button className="text-action" type="button" onClick={() => setStage("type")}>Type instead</button>
            </div>

            <footer className="micro-footer">Demo profiles and availability are synthetic.</footer>
          </div>
        )}

        {stage === "listening" && (
          <div className="screen listening-screen">
            <header className="minimal-header">
              <Wordmark />
              <button className="icon-button" type="button" onClick={() => setStage("welcome")} aria-label="Cancel">
                <X size={25} weight="light" aria-hidden="true" />
              </button>
            </header>

            <div className="voice-prompt listening-copy">
              <p className="eyebrow">Listening</p>
              <h1>Describe the GP you’d feel comfortable with.</h1>
              <p className="example">Health needs, culture, emotional support—whatever matters to you.</p>
            </div>

            <div className="voice-actions">
              <button className="mic-button recording" type="button" onClick={finishListening} aria-label="Finish voice description">
                <Microphone size={38} weight="light" aria-hidden="true" />
              </button>
              <WaveformMark active />
              <p className="listening-time">Listening · 0:{elapsed.toString().padStart(2, "0")}</p>
              <button className="text-action" type="button" onClick={finishListening}>Done</button>
            </div>
          </div>
        )}

        {stage === "type" && (
          <div className="screen type-screen">
            <header className="minimal-header">
              <button className="icon-button" type="button" onClick={() => setStage("welcome")} aria-label="Go back">
                <ArrowLeft size={25} weight="light" aria-hidden="true" />
              </button>
              <Wordmark />
              <span className="header-spacer" />
            </header>

            <div className="type-content">
              <p className="eyebrow">In your own words</p>
              <h1>Who would you feel comfortable seeing?</h1>
              <label className="sr-only" htmlFor="doctor-request">Describe the GP you want to see</label>
              <textarea
                id="doctor-request"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="For example: A woman GP with PCOS experience who understands South Indian family dynamics."
                autoFocus
              />
            </div>

            <div className="bottom-action">
              <button className="primary-button" type="button" disabled={!draft.trim()} onClick={() => {
                setRequest(draft);
                setStage("review");
              }}>
                Continue
              </button>
              <p>Don’t include identifying or urgent health details.</p>
            </div>
          </div>
        )}

        {stage === "review" && (
          <div className="screen review-screen">
            <header className="minimal-header">
              <Wordmark />
              <button className="text-action" type="button" onClick={reset}>Start over</button>
            </header>

            <div className="review-content">
              <p className="eyebrow">What matters to you</p>
              <h1>{requestHeadline}</h1>
              {requestHeadline !== requestSummary && (
                <p className="review-transcript">“{requestSummary}”</p>
              )}
              {requestPriorities.length > 0 && (
                <div className="priority-list" aria-label="Matching priorities">
                  {requestPriorities.map((priority) => <span key={priority}>{priority}</span>)}
                </div>
              )}
              <button className="refine-line" type="button" onClick={() => {
                setDraft(request);
                setStage("type");
              }}>
                <Waveform size={34} weight="light" aria-hidden="true" />
                <span>Refine</span>
                <PencilSimple size={18} weight="light" aria-hidden="true" />
              </button>
            </div>

            <div className="bottom-action">
              <button className="primary-button" type="button" onClick={() => findMatches(request)}>Find my matches</button>
              <p>We’ll show fit reasons, not ratings.</p>
            </div>
          </div>
        )}

        {stage === "matching" && (
          <div className="screen matching-screen">
            <Wordmark />
            <div>
              <WaveformMark active />
              <h1>Finding the right fit…</h1>
              <p>Looking across clinical focus, cultural context and manner.</p>
            </div>
          </div>
        )}

        {stage === "match" && (
          <div className="screen match-screen">
            <header className="minimal-header match-header">
              <Wordmark />
              <button className="match-count" type="button" onClick={() => setStage("all")}>
                {matchIndex + 1} of {matches.length}
                <List size={17} weight="regular" aria-hidden="true" />
              </button>
            </header>

            <div className="request-banner">
              <p className="eyebrow">You asked for</p>
              <h1>{requestHeadline}</h1>
              <button className="refine-compact" type="button" onClick={() => {
                setDraft(request);
                setStage("type");
              }}>
                <WaveformMark />
                <span>Refine</span>
              </button>
            </div>

            <div
              className="match-portrait"
              onPointerDown={(event) => { swipeStart.current = event.clientX; }}
              onPointerUp={(event) => {
                if (swipeStart.current === null) return;
                const distance = event.clientX - swipeStart.current;
                if (Math.abs(distance) > 55) moveMatch(distance < 0 ? 1 : -1);
                swipeStart.current = null;
              }}
            >
              <Image
                src={clinician.image}
                alt={`Portrait of ${clinician.name}`}
                fill
                sizes="(max-width: 520px) 100vw, 440px"
                priority
              />
              <button className="portrait-nav previous" type="button" onClick={() => moveMatch(-1)} aria-label="Previous match">
                <CaretLeft size={24} weight="light" aria-hidden="true" />
              </button>
              <button className="portrait-nav next" type="button" onClick={() => moveMatch(1)} aria-label="Next match">
                <CaretRight size={24} weight="light" aria-hidden="true" />
              </button>
            </div>

            <div className="match-details" key={clinician.id}>
              <h2>{clinician.name}</h2>
              <p className="clinician-meta">{clinician.title} · {clinician.suburb}</p>
              <div className="fit-signal-row" aria-label="Key match reasons">
                {clinician.fitSignals.slice(0, 3).map((signal) => <span key={signal}>{signal}</span>)}
              </div>
              <div className="practical-signal-row" aria-label="Practical appointment details">
                {clinician.practicalSignals.slice(0, 2).map((signal) => <span key={signal}>{signal}</span>)}
              </div>
              <p className="availability">Accepting new patients · Next: {clinician.nextAvailable.split(",")[0]}</p>
              <button className="primary-button" type="button" onClick={() => setStage("profile")}>View profile</button>
            </div>
          </div>
        )}

        {stage === "all" && (
          <div className="screen all-screen">
            <header className="minimal-header">
              <button className="icon-button" type="button" onClick={() => setStage("match")} aria-label="Back to current match">
                <ArrowLeft size={25} weight="light" aria-hidden="true" />
              </button>
              <Wordmark />
              <span className="header-spacer" />
            </header>
            <div className="all-heading">
              <p className="eyebrow">Tailored for you</p>
              <h1>{matches.length} GPs to explore</h1>
            </div>
            <div className="clinician-list">
              {matches.map((item) => (
                <button key={item.id} className="clinician-row" type="button" onClick={() => chooseClinician(item)}>
                  <Image src={item.image} alt="" width={72} height={72} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.focus} · {item.suburb}</small>
                    <small className="row-practical">{item.practicalSignals.slice(0, 2).join(" · ")}</small>
                    <small className="row-availability">Next: {item.nextAvailable}</small>
                  </span>
                  <CaretRight size={20} weight="light" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "profile" && (
          <div className="screen profile-screen">
            <header className="minimal-header profile-header">
              <button className="icon-button" type="button" onClick={() => setStage("match")} aria-label="Back to matches">
                <ArrowLeft size={25} weight="light" aria-hidden="true" />
              </button>
              <Wordmark />
              <button className="text-action" type="button" onClick={() => setStage("all")}>All matches</button>
            </header>

            <div className="profile-portrait">
              <Image src={clinician.image} alt={`Portrait of ${clinician.name}`} fill sizes="(max-width: 520px) 100vw, 440px" priority />
            </div>

            <div className="profile-content">
              <p className="eyebrow">Why this fit</p>
              <h1>{clinician.name}</h1>
              <p className="clinician-meta">{clinician.title} · {clinician.pronouns} · {clinician.suburb}</p>
              <div className="fit-signal-row profile-fit-signals" aria-label="Key match reasons">
                {clinician.fitSignals.map((signal) => <span key={signal}>{signal}</span>)}
              </div>
              <div className="practical-signal-row profile-practical-signals" aria-label="Practical appointment details">
                {clinician.practicalSignals.map((signal) => <span key={signal}>{signal}</span>)}
              </div>

              <div className="fit-list">
                <p>{clinician.matchLine}</p>
                <p>{clinician.appointmentLength}</p>
                <p>{clinician.distance}</p>
              </div>

              <section>
                <h2>About</h2>
                <p>{clinician.about}</p>
              </section>

              <section>
                <h2>Focus and experience</h2>
                <ul>
                  {clinician.experience.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>

              <section>
                <h2>Languages</h2>
                <p>{clinician.languages.join(" · ")}</p>
              </section>
            </div>

            <div className="profile-footer">
              <div>
                <span>Next available</span>
                <strong>{clinician.nextAvailable}</strong>
              </div>
              <button className="primary-button" type="button" onClick={() => setStage("booking")}>Request appointment</button>
            </div>
          </div>
        )}

        {stage === "booking" && (
          <div className="screen booking-screen">
            <header className="minimal-header">
              <button className="icon-button" type="button" onClick={() => setStage("profile")} aria-label="Back to profile">
                <ArrowLeft size={25} weight="light" aria-hidden="true" />
              </button>
              <Wordmark />
              <span className="header-spacer" />
            </header>

            <div className="booking-content">
              <p className="eyebrow">Request an appointment</p>
              <h1>Choose a time with {clinician.shortName}</h1>
              <p>The practice will confirm the request. No medical details are sent here.</p>
              <div className="time-list" role="radiogroup" aria-label="Available appointment times">
                {[clinician.nextAvailable, "Wednesday, 2:10 pm", "Friday, 9:40 am"].map((time) => (
                  <button
                    key={time}
                    type="button"
                    role="radio"
                    aria-checked={selectedTime === time}
                    className={selectedTime === time ? "selected" : ""}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="bottom-action">
              <button className="primary-button" type="button" disabled={!selectedTime} onClick={() => setStage("confirmed")}>Send request</button>
              <p>Demo only—nothing will be sent.</p>
            </div>
          </div>
        )}

        {stage === "confirmed" && (
          <div className="screen confirmed-screen">
            <Wordmark />
            <div>
              <CheckCircle size={58} weight="light" aria-hidden="true" />
              <p className="eyebrow">Request ready</p>
              <h1>{selectedTime}</h1>
              <p>In the live product, {clinician.name}’s practice would confirm this time with you.</p>
            </div>
            <button className="primary-button" type="button" onClick={reset}>Find another GP</button>
          </div>
        )}
      </section>
    </main>
  );
}
