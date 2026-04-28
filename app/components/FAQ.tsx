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
                  Enter your bust/chest, waist, and hip measurements. The tool compares your proportions to common
                  body-shape patterns and returns your closest match.
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
                  Results update instantly as you move the sliders or enter values.
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
                  It is designed for directional classification, not clinical diagnosis. Accuracy improves when you
                  measure consistently at the same body landmarks.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                How should I take measurements?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  Use a flexible tape. Measure bust/chest at the fullest point, waist at the narrowest point, and
                  hips at the widest point while keeping the tape level.
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
