import type { Metadata } from "next";
import Link from "next/link";
import { InterestForm } from "./interest-form";

export const metadata: Metadata = {
  title: "CareYield — recognise PMOS earlier in Blacktown",
  description:
    "A community program helping South Asian women in Blacktown and neighbouring suburbs recognise PMOS, formerly PCOS, earlier.",
};

const steps = [
  {
    title: "Start in the community",
    body: "Mothers and daughters together, in language, in the schools, temples, mosques and women’s groups people already trust.",
  },
  {
    title: "Take a self-check to your doctor",
    body: "Because recognising the signs matters, but it only becomes useful when it leads to a proper conversation and assessment.",
  },
  {
    title: "Find a clinician who understands",
    body: "Someone who knows the condition and understands language, family pressure and what can make it hard to speak openly.",
  },
];

export default function Home() {
  return (
    <main className="community-home">
      <header className="community-header">
        <div className="community-wrap community-header-inner">
          <Link href="/" className="community-wordmark" aria-label="CareYield home">CareYield</Link>
          <Link href="/finder" className="community-demo-link">Open the early demo</Link>
        </div>
      </header>

      <section className="community-hero community-wrap" aria-labelledby="community-hero-title">
        <p className="community-eyebrow">Blacktown and neighbouring suburbs · early community program</p>
        <h1 id="community-hero-title">
          Helping South Asian women in Blacktown and neighbouring suburbs find out they have PMOS (formerly PCOS) years earlier.
        </h1>
        <p className="community-hero-copy">
          <strong>PMOS</strong> stands for polyendocrine metabolic ovarian syndrome.
          It affects hormones, periods, skin, metabolism and mental wellbeing — not just ovaries or fertility.
        </p>
        <a className="community-primary-link" href="#register">Register interest</a>
        <p className="community-synthetic-note">
          <strong>We are early.</strong> The clinician demo profiles and availability are synthetic.
          They show the idea, not a finished service. Community information and self-checks do not
          diagnose PMOS; a clinician needs to assess the full picture.
        </p>
      </section>

      <section className="community-section community-problem" aria-labelledby="problem-heading">
        <div className="community-wrap">
          <p className="community-eyebrow">Why this gets missed</p>
          <h2 id="problem-heading" className="sr-only">The PMOS awareness problem</h2>
          <div className="community-problem-block">
            <p>Around <strong>1 in 8</strong> women of reproductive age has PMOS.</p>
            <p>In one Australian cohort, about half who met the criteria did not know.</p>
          </div>
          <blockquote>
            “My mother had it. My sister has it. My friends have it. So I thought this was just
            how women in my family are.”
          </blockquote>
          <div className="community-problem-block community-problem-last">
            <p>It is not that women are hiding symptoms.</p>
            <p>It is that nobody told them they were symptoms.</p>
          </div>
        </div>
      </section>

      <section className="community-section" aria-labelledby="what-we-do-heading">
        <div className="community-wrap">
          <div className="community-section-heading">
            <p className="community-eyebrow">What we do</p>
            <h2 id="what-we-do-heading">The community is the product.</h2>
            <p>The software simply helps turn what happens in the room into something people can act on — and something we can measure.</p>
          </div>
          <ol className="community-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="community-measure-note">
            We will measure self-checks taken forward and assessments completed — not how many people saw a poster or sat in a room.
          </p>
        </div>
      </section>

      <section className="community-section community-why" aria-labelledby="why-heading">
        <div className="community-wrap">
          <div className="community-section-heading">
            <p className="community-eyebrow">Why it matters</p>
            <h2 id="why-heading">This is whole-life health.</h2>
            <p>
              Women with PMOS have around three times the risk of type 2 diabetes and a higher risk of
              gestational diabetes in pregnancy. In Australia, 24% reported waiting more than two years
              for answers after first seeking help.
            </p>
          </div>
          <blockquote className="community-life-course">
            PMOS does not stop at fertility. It is linked to gestational diabetes during pregnancy and
            metabolic disease in midlife, and its effects can continue into perimenopause. Recognising it
            at sixteen can change decades of care, not just a few years of fertility decisions.
          </blockquote>
          <aside className="community-trust-note">
            <strong>A scan is not always needed.</strong>
            <p>
              Since the 2023 guideline, an adult with irregular cycles and signs of higher androgen activity
              may be assessed without an ultrasound. A GP still needs to check the full picture and rule out other causes.
            </p>
          </aside>
          <p className="community-sources">
            Sources: <a href="https://www.monash.edu/medicine/mchri/pcos/guideline">2026 PMOS terminology update</a>,{" "}
            <a href="https://academic.oup.com/humrep/article/36/8/2275/6272134">Australian cohort study</a>,{" "}
            <a href="https://doi.org/10.1093/fampra/cmu028">Australian diagnosis-experience study</a> and{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/">2023 international guideline summary</a>.
          </p>
        </div>
      </section>

      <section className="community-section community-team" aria-labelledby="team-heading">
        <div className="community-wrap">
          <div className="community-section-heading">
            <p className="community-eyebrow">Who we are</p>
            <h2 id="team-heading">Built from lived experience.</h2>
          </div>
          <div className="community-people">
            <article>
              <p className="community-person-mark" aria-hidden="true">N</p>
              <h3>Narayani</h3>
              <p>Narayani has PMOS. She spent years assuming it was normal, because women around her were living with the same signs.</p>
            </article>
            <article>
              <p className="community-person-mark" aria-hidden="true">S</p>
              <h3>Stefan</h3>
              <p>Stefan is building the simple infrastructure that helps community conversations lead to practical next steps and measurable follow-through.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="register" className="community-register" aria-labelledby="register-heading">
        <div className="community-wrap community-register-grid">
          <div>
            <p className="community-eyebrow">Register interest</p>
            <h2 id="register-heading">Tell us where you fit.</h2>
            <p>We are starting in Blacktown, Seven Hills, Doonside, Toongabbie, Quakers Hill, Rooty Hill, Mount Druitt and nearby suburbs. Leave your details if you want to hear about a session or help test what comes next.</p>
          </div>
          <InterestForm />
        </div>
      </section>

      <footer className="community-footer">
        <div className="community-wrap">
          <p>We are building a self-check tool and a clinician directory. Join the list to test them.</p>
          <div>
            <a href="mailto:stefan.thottunkal@gmail.com">stefan.thottunkal@gmail.com</a>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
