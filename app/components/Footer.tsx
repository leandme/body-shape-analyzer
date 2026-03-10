export default function Footer() {
    return (
        <footer className="footer bg-black text-base-content p-10">
            <aside>
            {/* <img src="/favicon.ico" alt="Roast Generator Logo" className="w-12 h-12 " /> */}
                <p className="text-base text-white">
                    <b className="font-heading">Jawline Check</b>
                    <br />
                    Copyright 2025 - all rights reserved.
                </p>

            </aside>
            <nav>
                <h4 className="footer-title font-heading text-lg text-white">Tools</h4>
                <p><a className="link link-hover text-white" href="https://bodyfatestimator.ai/">Bodyfat Estimator</a></p>
                <p><a className="link link-hover text-white" href="https://bodyfatestimator.ai/jawline-check">Jawline Analysis Tool</a></p>
            </nav>
        </footer>
    );
}
