export default function SplashLogo({ visible }) {
  if (!visible) return null;

  return (
    <div className="splash-overlay">
        <div className="splash-card">
        <div className="splash-content">
          <div className="splash-logo">
            <div className="logo-main">
              <svg viewBox="0 0 29.667 31.69" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12.827,1.628A1.561,1.561,0,0,1,14.31,0h2.964a1.561,1.561,0,0,1,1.483,1.628v11.9a9.252,9.252,0,0,1-2.432,6.852q-2.432,2.409-6.963,2.409T2.4,20.452Q0,18.094,0,13.669V1.628A1.561,1.561,0,0,1,1.483,0h2.98A1.561,1.561,0,0,1,5.947,1.628V13.191a5.635,5.635,0,0,0,.85,3.451,3.153,3.153,0,0,0,2.632,1.094,3.032,3.032,0,0,0,2.582-1.076,5.836,5.836,0,0,0,.816-3.486Z" />
                <path d="M29.297,20.857a1.561,1.561,0,0,1-1.483,1.628h-2.98a1.561,1.561,0,0,1-1.483-1.628V1.628A1.561,1.561,0,0,1,24.833,0h2.98a1.561,1.561,0,0,1,1.483,1.628Z" />
                <path d="M0,28.055A1.561,1.561,0,0,1,1.483,26.427h26.7a1.561,1.561,0,0,1,1.483,1.628v2.006a1.561,1.561,0,0,1-1.483,1.628H1.483A1.561,1.561,0,0,1,0,30.061Z" />
              </svg>
            </div>
            <div className="logo-second-text">Socialito</div>
            <span className="logo-trail" />
          </div>
        </div>
        <span className="splash-bottom"></span>
      </div>
    </div>
  );
}
