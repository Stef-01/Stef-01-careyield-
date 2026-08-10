import type { Metadata } from "next";
import Link from "next/link";
import { InterestForm } from "./interest-form";

export const metadata: Metadata = {
  title: "CareYield — earlier PMOS answers in Western Sydney",
  description:
    "A community program helping South Asian women in Western Sydney recognise PMOS, the condition long known as PCOS, earlier.",
};

const steps = [
  {
    title: "Talk where people gather",
    body: "Mothers and daughters together, in language and in trusted community spaces.",
  },
  {
    title: "Take a self-check to a GP",
    body: "A simple next step that turns recognition into a clinical conversation.",
  },
  {
    title: "Find the right clinician",
    body: "Someone who understands PMOS, culture, language and family pressure.",
  },
];

export default function Home() {
  return (
    <main className="community-home">
      <header className="community-header">
        <div className="community-wrap community-header-inner">
          <Link href="/" className="community-wordmark" aria-label="CareYield home">
            CareYield
          </Link>
          <Link href="/finder" className="community-demo-link">
            Early demo
          </Link>
        </div>
      </header>

      <aside className="community-early-note">
        <div className="community-wrap">
          <strong>Early prototype.</strong> Demo clinician profiles and availability are synthetic.
        </div>
      </aside>

      <section className="community-hero" aria-labelledby="community-hero-title">
        <div className="community-wrap community-hero-grid">
          <div>
            <p className="community-eyebrow">A Western Sydney community program</p>
            <h1 id="community-hero-title">
              Helping South Asian women find <em>answers earlier.</em>
            </h1>
          </div>
          <div className="community-hero-action">
            <p>
              We start with PMOS — the condition long known as PCOS — and the signs families
              are too often told are normal.
            </p>
            <a className="community-primary-link" href="#register">
              Register interest
            </a>
          </div>
        </div>
      </section>

      <section className="community-section community-problem" aria-labelledby="problem-heading">
        <div className="community-wrap community-statement-grid">
          <p className="community-eyebrow">The gap</p>
          <div>
            <h2 id="problem-heading">
              One in eight women has PMOS. <em>Around half do not know.</em>
            </h2>
            <p className="community-supporting-copy">
              Symptoms can run through a family. That makes them feel normal, not like signs
              worth checking.
            </p>
          </div>
        </div>
      </section>

      <section className="community-quote" aria-label="A common experience">
        <div className="community-wrap">
          <blockquote>
            “My mother had it. My sister has it. My friends have it. So I thought this was just
            how women in my family are.”
          </blockquote>
        </div>
      </section>

      <section className="community-section" aria-labelledby="what-we-do-heading">
        <div className="community-wrap">
          <div className="community-statement-grid">
            <p className="community-eyebrow">What we do</p>
            <h2 id="what-we-do-heading">
              The community creates trust. <em>We make the next step clear.</em>
            </h2>
          </div>
          <ol className="community-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="community-section community-why" aria-labelledby="why-heading">
        <div className="community-wrap community-statement-grid">
          <p className="community-eyebrow">Why early matters</p>
          <div>
            <h2 id="why-heading">
              An earlier answer can change <em>decades of health.</em>
            </h2>
            <p className="community-supporting-copy">
              PMOS is linked with type 2 diabetes, gestational diabetes and metabolic health
              through midlife. It does not stop at fertility.
            </p>
            <details className="community-sources">
              <summary>Sources and clinical context</summary>
              <p>
                Evidence: <a href="https://www.monash.edu/medicine/mchri/pcos/guideline">PMOS terminology update</a>,{" "}
                <a href="https://academic.oup.com/humrep/article/36/8/2275/6272134">Australian cohort study</a>,{" "}
                <a href="https://doi.org/10.1093/fampra/cmu028">Australian diagnosis study</a> and{" "}
                <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/">international guideline summary</a>.
                A clinician must assess the full picture; a self-check cannot diagnose PMOS.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="community-section community-team" aria-labelledby="team-heading">
        <div className="community-wrap">
          <div className="community-statement-grid">
            <p className="community-eyebrow">Who we are</p>
            <h2 id="team-heading">
              Built from lived experience, <em>clinical training and research.</em>
            </h2>
          </div>
          <div className="community-people">
            <article>
              <p className="community-person-role">Co-founder · Lived experience</p>
              <h3>Narayani</h3>
              <p>
                Narayani has PMOS. She spent years undiagnosed, assuming it was normal. She
                studied Clinical Science at Macquarie University, then completed first-class
                honours research in VR stroke rehabilitation at the University of Sydney.
              </p>
            </article>
            <article>
              <p className="community-person-role">Co-founder · Health systems</p>
              <h3>Stefan</h3>
              <p>
                Stefan is a physician-in-training and health systems researcher at Stanford
                Medicine. For five years, he has advised the federal government and researched
                primary care, digital health and AI-enabled public health.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="register" className="community-register" aria-labelledby="register-heading">
        <div className="community-wrap community-register-grid">
          <div>
            <p className="community-eyebrow">Stay close</p>
            <h2 id="register-heading">
              Help shape what <em>comes next.</em>
            </h2>
            <p>Hear about community sessions or test the first self-check and directory.</p>
          </div>
          <InterestForm />
        </div>
      </section>

      <footer className="community-footer">
        <div className="community-wrap">
          <Link href="/" className="community-footer-wordmark">CareYield</Link>
          <div>
            <a href="mailto:stefan.thottunkal@gmail.com">Contact</a>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
