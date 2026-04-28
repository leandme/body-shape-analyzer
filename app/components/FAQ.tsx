export default function FAQ() {
  return (
    <div id="faq" className="hero mt-10 lg:mt-40 flex items-center justify-center bg-base-100">
      <div className="hero-content w-full px-4">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <h2 className="text-xl lg:text-4xl text-center font-bold">
            Frequently Asked Questions
          </h2>
          <p className="py-6 text-lg mb-6 text-center">
          Have another question? Reach out to our support team by sending us an <a href="mailto:matt@leandme.com" className="text-primary">email</a> and we’ll get back to you as soon as we can.
          </p>

          {/* FAQ Items */}
          <div className="space-y-4">
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                How does it work?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  Upload a clear full-body photo and the AI analyzes visual cues like silhouette balance, waist
                  definition, and body-frame proportions to estimate your likely body shape.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                How long does it take?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  Most analyses are completed in under 20 seconds.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                Is it accurate?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  It is designed for directional classification, not clinical diagnosis. Accuracy improves with clear
                  full-body framing, better lighting, and a neutral camera angle.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                What kind of photo works best?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  Use a full-body standing photo with head-to-feet visibility. Avoid heavy obstructions, extreme
                  camera angles, and poor lighting.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
              Is my data safe?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  Yes. We prioritize privacy and process submitted data only to provide and improve the service. See
                  our Privacy Policy for details on retention and handling.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                I have another question...
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  No worries! Contact me via <a href="mailto:matt@leandme.com" className="text-primary">
            email.
          </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
