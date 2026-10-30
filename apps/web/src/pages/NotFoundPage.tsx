import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function NotFoundPage() {
  return (
    <div>
      <PageHeader
        title="Page not found"
        description="The requested page does not exist in this preview."
      />
      <p className="mt-6 text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/">
          Return to home
        </Link>
      </p>
    </div>
  );
}
