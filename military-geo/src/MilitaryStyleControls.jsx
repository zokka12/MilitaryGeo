import "./MilitaryStyleControls.css";

export default function MilitaryStyleControls({ style, setStyle }) {
    return (
        <div className="style-container">
            <div style={{ fontWeight: "bold", marginBottom: "8px" , fontSize: "16px" }}>Styl warstwy</div>

            <label>Kolor: </label>
            <input
                type="color"
                value={style.color}
                onChange={(e) => setStyle({ ...style, color: e.target.value })}
            /><br />

            <label>Grubość: {style.weight}</label><br />
            <input
                type="range" min="1" max="15"
                value={style.weight}
                onChange={(e) => setStyle({ ...style, weight: parseInt(e.target.value) })}
            /><br />

            <label>Przezroczystość: {style.fillOpacity}</label><br />
            <input
                type="range" min="0" max="1" step="0.1"
                value={style.fillOpacity}
                onChange={(e) => setStyle({ ...style, fillOpacity: parseFloat(e.target.value) })}
            />
        </div>
    );
}