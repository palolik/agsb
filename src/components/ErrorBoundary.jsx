import { Component } from "react";
import { Link } from "react-router-dom";
import { HiExclamation } from "react-icons/hi";

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
    return (
      <div role="alert" className="max-w-lg mx-auto px-4 py-16">
        <div className="card bg-base-200 border border-base-300 p-8 text-center">
          <HiExclamation className="w-14 h-14 text-warning mx-auto mb-3" />
          <h1 className="text-xl font-bold text-base-content">কিছু একটা সমস্যা হয়েছে</h1>
          <p className="text-base-content/60 mt-2">Something went wrong while showing this page. Please try again.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
            <button type="button" className="btn btn-primary" onClick={this.reset}>Try again</button>
            <Link to="/" className="btn btn-ghost">Go home</Link>
          </div>
        </div>
      </div>
    );
  }
}
