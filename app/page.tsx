"use client";
import { useState } from "react";
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
  Mail,
  Phone,
  Star,
  ChevronLeft,
  ChevronRight,
  Award,
  Users,
  TrendingUp,
} from "lucide-react";
import { Header, Footer, TrackingForm, Assurance } from "./components/Shell";

const reviews = [
  {
    name: "Sarah Mitchell",
    company: "Tech Innovations Ltd",
    rating: 5,
    text: "ADEXEC has been our trusted logistics partner for over 3 years. Their real-time tracking and professional service have made international shipping effortless for our business.",
    location: "London, UK",
  },
  {
    name: "Marcus Chen",
    company: "Global Trade Solutions",
    rating: 5,
    text: "Outstanding service from start to finish. The team handled our time-sensitive cargo with precision and kept us informed every step of the way. Highly recommended!",
    location: "Singapore",
  },
  {
    name: "Elena Rodriguez",
    company: "Artisan Exports",
    rating: 5,
    text: "Professional, reliable, and efficient. ADEXEC's expertise in handling delicate shipments across multiple countries is unmatched. They've never let us down.",
    location: "Barcelona, Spain",
  },
  {
    name: "James Thompson",
    company: "Manufacturing Pro Inc",
    rating: 5,
    text: "We ship heavy machinery worldwide and ADEXEC handles everything seamlessly. Their ocean freight service is top-notch with competitive rates and excellent communication.",
    location: "Houston, USA",
  },
  {
    name: "Priya Sharma",
    company: "E-commerce Solutions",
    rating: 5,
    text: "Fast, reliable, and cost-effective. ADEXEC's express delivery service has helped us meet tight deadlines consistently. Their customer support is exceptional.",
    location: "Mumbai, India",
  },
];

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
  const scrollReviews = (direction: 'left' | 'right') => {
    const track = document.querySelector('.reviews-track') as HTMLElement;
    if (track) {
      const scrollAmount = direction === 'left' ? -440 : 440;
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Contact Bar */}
      <div className="top-contact-bar">
        <div className="wrap contact-bar-inner">
          <div className="contact-info">
            <a href="mailto:hello@adexec.com" className="contact-item">
              <Mail size={16} />
              hello@adexec.com
            </a>
            <a href="tel:+15625216164" className="contact-item">
              <Phone size={16} />
              +1 (562) 521-6164
            </a>
          </div>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
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

        {/* About Us Section */}
        <section className="about-section">
          <div className="wrap about-grid">
            <div className="about-content">
              <span className="eyebrow">04 / ABOUT ADEXEC</span>
              <h2>
                12 years of excellence.
                <br />
                202 countries covered.
              </h2>
              <p>
                We have worked in the expedited delivery business for the past 12 years, building a reputation for reliability and precision across 202 countries worldwide. Our success is built on a foundation of expertise, trust, and an unwavering commitment to your satisfaction.
              </p>
              <p>
                We bring with us a core group of managers and delivery professionals that are second to none in the business community. Our team combines decades of logistics experience with cutting-edge technology to ensure your shipments arrive safely, on time, every time.
              </p>
              <p>
                From small parcels to large-scale cargo, we handle each shipment with the same level of care and professionalism. Our global network, advanced tracking systems, and dedicated support team work together to deliver not just packages, but peace of mind.
              </p>
            </div>
            <div className="about-stats">
              <div className="about-stat-card">
                <Award size={36} strokeWidth={1.5} />
                <strong>12 Years</strong>
                <span>Of trusted logistics expertise</span>
              </div>
              <div className="about-stat-card">
                <Globe2 size={36} strokeWidth={1.5} />
                <strong>202 Countries</strong>
                <span>Worldwide coverage</span>
              </div>
              <div className="about-stat-card">
                <Users size={36} strokeWidth={1.5} />
                <strong>Elite Team</strong>
                <span>Industry-leading professionals</span>
              </div>
              <div className="about-stat-card">
                <TrendingUp size={36} strokeWidth={1.5} />
                <strong>99.8% On-Time</strong>
                <span>Delivery success rate</span>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="reviews-section">
          <div className="wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">TRUSTED BY BUSINESSES WORLDWIDE</span>
                <h2>
                  What our clients
                  <br />
                  are saying.
                </h2>
              </div>
              <p>
                Real feedback from real businesses.
                <br className="desktop-only" />
                See why companies trust ADEXEC for their shipping needs.
              </p>
            </div>
            <div className="reviews-carousel">
              <button 
                className="carousel-nav prev" 
                aria-label="Previous review"
                onClick={() => scrollReviews('left')}
              >
                <ChevronLeft size={24} />
              </button>
              <div className="reviews-track">
                {reviews.map((review, i) => (
                  <div className="review-card" key={i}>
                    <div className="review-stars">
                      {[...Array(review.rating)].map((_, j) => (
                        <Star key={j} size={18} fill="#ed8a2e" stroke="#ed8a2e" />
                      ))}
                    </div>
                    <p className="review-text">"{review.text}"</p>
                    <div className="review-author">
                      <div>
                        <strong>{review.name}</strong>
                        <span>{review.company}</span>
                        <span className="review-location">{review.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className="carousel-nav next" 
                aria-label="Next review"
                onClick={() => scrollReviews('right')}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="newsletter-section">
          <div className="wrap newsletter-content">
            <div className="newsletter-text">
              <h2>Subscribe to our newsletter</h2>
              <p>Focused on the transport and logistic industry. Get the latest updates, tips, and exclusive offers.</p>
            </div>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                required
                aria-label="Email address"
              />
              <button type="submit" className="button orange">
                Subscribe
              </button>
            </form>
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
