import { Component } from "react";
import { Link } from "react-router-dom";
import { HiExclamation } from "react-icons/hi";
import { useLang } from "../context/LanguageContext";

// Fallback UI; a function component so it can read the site language.
function CrashFallback({ onReset }) {
  const { t } = useLang();
  return (
    <div role="alert" className="max-w-lg mx-auto px-4 py-16">
      <div className="card bg-base-200 border border-base-300 p-8 text-center">
        <HiExclamation className="w-14 h-14 text-warning mx-auto mb-3" />
        <h1 className="text-xl font-bold text-base-content">{t("কিছু একটা সমস্যা হয়েছে", "Something went wrong")}</h1>
        <p className="text-base-content/60 mt-2">{t("পেজটি দেখানোর সময় একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।", "Something went wrong while showing this page. Please try again.")}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
          <button type="button" className="btn btn-primary" onClick={onReset}>{t("আবার চেষ্টা করুন", "Try again")}</button>
          <Link to="/" className="btn btn-ghost">{t("হোমে যান", "Go home")}</Link>
        </div>
      </div>
    </div>
  );
}

// Catches render errors in a page so one bad record can't blank the whole
// site. App keys it on the pathname, so navigating away resets it.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <CrashFallback onReset={this.reset} />;
  }
}
