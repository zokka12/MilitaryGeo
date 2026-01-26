// MilitaryButton.jsx
import "./MilitaryButton.css"; // Importujemy style, które stworzyłaś w Kroku 1

export default function MilitaryButton({ label, isActive, onClick }) {
    return (
        <button
            className={`military-btn ${isActive ? "active" : ""}`}
            onClick={onClick}
            title={label} // Tooltip po najechaniu
        >
            {label}
        </button>
    );
}