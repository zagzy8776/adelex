import {
  ArrowUpRight,
  ArrowRight,
  Truck,
  Plane,
  Ship,
  PackageCheck,
  Navigation,
  ShieldCheck,
  MapPin,
  Check,
  Globe2,
  Clock3,
  Headphones,
} from "lucide-react";
import { Header, Footer, TrackingForm, Assurance } from "./components/Shell";

const serviceList = [
  {
    n: "01",
    icon: Truck,
    title: "Road freight",
    text: "From a single parcel to larger loads. Plan your next delivery with a service built around your route.",
    image:
      "/d1afba0c07fd187ce373fb43f30a953d.mp4",
    alt: "Freight truck on the highway",
    isVideo: true,
  },
  {
    n: "02",
    icon: Plane,
    title: "Air freight",
    text: "For the shipments that cannot wait. Request an air freight option that fits your schedule.",
    image:
      "/5f322566537d23421aef511568d0f4b7.mp4",
    alt: "Cargo aircraft on the tarmac",
    isVideo: true,
  },
  {
    n: "03",
    icon: Ship,
    title: "Ocean freight",
    text: "Make room for bigger possibilities. Explore shipping options for commercial and bulk cargo.",
    image:
      "https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=900&q=80",
    alt: "Shipping containers at port",
  },
  {
    n: "04",
    icon: PackageCheck,
    title: "Express delivery",
    text: "Keep everyday business moving with pickup and delivery arrangements for time-sensitive parcels.",
    image:
      "/1f5c3103a33efb95e5f71952a8f806c4.mp4",
    alt: "Express package delivery",
    isVideo: true,
  },
];

const gallery = [
  {
    src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    alt: "Warehouse logistics operations",
  },
  {
    src: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80",
    alt: "Air cargo containers",
  },
  {
    src: "https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=800&q=80",
    alt: "Shipping containers at port",
  },
  {
    src: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80",
    alt: "Delivery truck fleet",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-grid wrap">
            <div className="hero-copy reveal">
              <div className="eyebrow light">
                <span /> YOUR NEXT MOVE, DELIVERED.
              </div>
              <h1>
                Every shipment.
                <br />A promise
                <br />
                <em>delivered.</em>
              </h1>
              <p>
                Your goods matter. Move them with clarity, care,
                <br className="desktop-only" /> and a shipping partner that
                keeps you informed.
              </p>
              <div className="hero-actions">
                <a href="/request" className="button orange">
                  Let’s get it moving <ArrowUpRight size={19} />
                </a>
                <a href="#services" className="text-link">
                  Explore our services <ArrowRight size={17} />
                </a>
              </div>
              <Assurance />
            </div>
            <div className="hero-visual reveal">
              <img
                className="ship-image"
                src="/images/cargo-ship.jpg"
                alt="A container ship carrying freight across the ocean"
                fetchPriority="high"
              />
              <div className="image-shade" />
              <div className="visual-label">
                <span className="small-cross">+</span> CONNECTING PLACES.
                <br />
                DELIVERING POSSIBILITIES.
              </div>
              <div className="hero-coordinate">
                ADEXEC / ALWAYS MOVING FORWARD
              </div>
              <div className="floating-card">
                <div className="floating-icon">
                  <Plane size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <strong>A clearer view of every journey</strong>
                  <span>Track locations. Follow milestones.</span>
                </div>
                <div className="floating-check">
                  <Check size={16} />
                </div>
              </div>
            </div>
          </div>
          <div className="hero-bottom-line wrap">
            <span>BUILT AROUND YOUR BUSINESS</span>
            <span>
              BY ROAD <i /> BY AIR <i /> BY SEA
            </span>
          </div>
        </section>

        <section className="track-bar wrap" aria-label="Track your shipment">
          <div>
            <span className="eyebrow">STAY IN THE KNOW</span>
            <h2>Where’s your shipment?</h2>
          </div>
          <div className="track-bar-form">
            <TrackingForm />
            <p>Have a tracking number? Follow your shipment’s journey.</p>
          </div>
        </section>

        <section className="photo-strip" aria-hidden="true">
          {gallery.map((g) => (
            <div className="photo-strip-item" key={g.src}>
              <img src={g.src} alt={g.alt} loading="lazy" />
            </div>
          ))}
        </section>

        <section className="section wrap" id="services">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / OUR SERVICES</span>
              <h2>
                Whatever you’re moving.
                <br />
                We’ll help you get it there.
              </h2>
            </div>
            <p>
              From business essentials to your next big shipment,
              <br className="desktop-only" /> find the right way forward.
            </p>
          </div>
          <div className="services-grid visual-services">
            {serviceList.map((s) => (
              <a
                className="service visual-service"
                href={"/request?service=" + encodeURIComponent(s.title)}
                key={s.n}
              >
                <div className="service-image">
                  {s.isVideo ? (
                    <video
                      src={s.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img src={s.image} alt={s.alt} loading="lazy" />
                  )}
                  <span className="service-badge">{s.n}</span>
                </div>
                <div className="service-body">
                  <div className="service-top">
                    <s.icon size={28} strokeWidth={1.4} />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <span className="service-link">
                    Explore options <ArrowUpRight size={18} />
                  </span>
                </div>
              </a>
            ))}
          </div>
          <p className="service-note">
            Routes, availability, transit times, and pricing are confirmed with
            your shipping quote.
          </p>
        </section>

        <section className="stats-band">
          <div className="wrap stats-grid">
            <div className="stat">
              <Globe2 size={26} strokeWidth={1.5} />
              <strong>Worldwide</strong>
              <span>Road, air & ocean coverage</span>
            </div>
            <div className="stat">
              <Plane size={26} strokeWidth={1.5} />
              <strong>Live tracking</strong>
              <span>Map & milestone updates</span>
            </div>
            <div className="stat">
              <Clock3 size={26} strokeWidth={1.5} />
              <strong>On schedule</strong>
              <span>Clear ETAs you can plan around</span>
            </div>
            <div className="stat">
              <Headphones size={26} strokeWidth={1.5} />
              <strong>Real support</strong>
              <span>WhatsApp & dedicated team</span>
            </div>
          </div>
        </section>

        <section className="visibility-section">
          <div className="wrap visibility-grid">
            <div className="journey-illustration">
              <div className="journey-top">
                <span>
                  <span className="orange-dot" /> SHIPMENT VISIBILITY
                </span>
                <span className="demo-tag">EXAMPLE</span>
              </div>
              <svg viewBox="0 0 560 260" aria-hidden="true">
                <defs>
                  <pattern
                    id="dots"
                    width="22"
                    height="22"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="1" cy="1" r="1" fill="#d7dce2" />
                  </pattern>
                </defs>
                <rect width="560" height="260" fill="url(#dots)" />
                <path
                  d="M60 194 C170 210 150 70 280 116 S410 180 493 57"
                  fill="none"
                  stroke="#d6dbe0"
                  strokeWidth="4"
                  strokeDasharray="6 10"
                />
                <path
                  d="M60 194 C170 210 150 70 280 116"
                  fill="none"
                  stroke="#ed8a2e"
                  strokeWidth="4"
                />
                <circle cx="60" cy="194" r="8" fill="#081c33" />
                <circle cx="493" cy="57" r="8" fill="#081c33" />
                <circle cx="280" cy="116" r="29" fill="#f6e4d1" />
                <circle cx="280" cy="116" r="17" fill="#eb8d32" />
                {/* Airplane icon */}
                <g transform="translate(280, 116)">
                  <path
                    d="M-6 2 L6 -4 M6 -4 L2 6 M-6 -2 L6 -4 M-2 -6 L2 6"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <text x="40" y="231">
                  PICKUP
                </text>
                <text x="446" y="32">
                  DESTINATION
                </text>
              </svg>
              <div className="journey-bottom">
                <div className="mini-package">
                  <Plane size={22} strokeWidth={1.7} />
                </div>
                <div>
                  <strong>In transit</strong>
                  <p>A new milestone. One step closer.</p>
                </div>
                <span className="status-pill in_transit">On the move</span>
              </div>
            </div>
            <div className="visibility-copy">
              <span className="eyebrow">02 / VISIBILITY, EVERY STEP</span>
              <h2>
                A little less wondering.
                <br />A lot more knowing.
              </h2>
              <p>
                Enter one tracking number to see your shipment’s latest reported
                location, delivery estimate, and progress—all in one place.
              </p>
              <ul>
                <li>
                  <Check size={18} />
                  An interactive map of your shipment’s journey
                </li>
                <li>
                  <Check size={18} />
                  Clear updates from collection to delivery
                </li>
                <li>
                  <Check size={18} />A tracking link you can open on any device
                </li>
              </ul>
              <a className="text-link dark" href="/track?code=ADX-DEMO">
                Explore example tracking <ArrowUpRight size={19} />
              </a>
            </div>
          </div>
        </section>

        <section className="section wrap" id="how-it-works">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / SIMPLE FROM THE START</span>
              <h2>
                Your next delivery,
                <br />
                in three clear steps.
              </h2>
            </div>
            <a href="/request" className="button outline">
              Start your shipment <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="steps">
            <article>
              <span className="step-number">01</span>
              <h3>Tell us what’s moving.</h3>
              <p>
                Share your pickup, destination, and cargo details. Our team
                reviews your request and confirms the options.
              </p>
            </article>
            <article>
              <span className="step-number">02</span>
              <h3>We plan the journey.</h3>
              <p>
                Once arrangements are confirmed, you receive a unique tracking
                number to follow your shipment.
              </p>
            </article>
            <article>
              <span className="step-number">03</span>
              <h3>Follow it to the finish.</h3>
              <p>
                Check your map and shipment timeline for location updates,
                progress, and delivery confirmation.
              </p>
            </article>
          </div>
        </section>

        <section className="faq-section wrap">
          <div>
            <span className="eyebrow">GOOD TO KNOW</span>
            <h2>
              A few things,
              <br />
              before we go.
            </h2>
            <a href="/request" className="text-link dark">
              Have another question? <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="faqs">
            {[
              [
                "How do I track my shipment?",
                "Open the tracking link shared by our team, or enter your tracking number in the tracking box. You’ll see the latest status, reported location, delivery estimate, and shipment history.",
              ],
              [
                "Does the map show live GPS?",
                "The map shows the latest reported position and the time it was updated. When a driver shares an active GPS location, the map displays live GPS updates. Older readings are labelled as the last known position.",
              ],
              [
                "How much will shipping cost?",
                "Pricing depends on your route, cargo size and weight, service, and delivery requirements. Submit a shipping request so the team can confirm an appropriate quote.",
              ],
              [
                "What happens after I request a quote?",
                "Your request is reviewed by the shipping team. They will contact you using the details you provide. A request becomes a shipment only once arrangements are confirmed.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="wrap">
            <div>
              <span className="eyebrow light">READY WHEN YOU ARE.</span>
              <h2>
                Let’s move something
                <br />
                forward, together.
              </h2>
            </div>
            <a href="/request" className="button orange">
              Request a shipping quote <ArrowUpRight size={20} />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
