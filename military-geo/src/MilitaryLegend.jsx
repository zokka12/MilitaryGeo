import "./MilitaryLegend.css";

export default function MilitaryLegend({ label, count }) {
    return (
        <div className="legend-container">
            <div style={{ fontWeight: "bold", marginBottom: "5px" , fontSize: "16px" }}>Legenda</div>
            <div><strong>Typ:</strong> {label}</div>
            <div><strong>Obiekty:</strong> {count}</div>
        </div>
    );
}