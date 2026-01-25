// ---- IMPORTY ----
import "./MilitaryLayer.css"
import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import axios from "axios";
import osmtogeojson from "osmtogeojson";

// ---- LISTA TYPÓW ----
const MILITARY_TYPES = [
    "barracks",
    "naval_base",
    "all"
    // TODO: Dodaj więcej typów:
    // "airfield", "training_area", "range", "office", "danger_area", "shelter", "bunker"
];

// ---- ETYKIETY ----
const MILITARY_LABELS = {
    barracks: "Koszary",
    naval_base: "Baza morska",
    all: "Wszystkie obiekty wojskowe",
    // TODO: Dodaj tłumaczenia dla nowych typów
};

// ---- KOMPONENT ----
export default function MilitaryOSMLayer() {
    const [militaryType, setMilitaryType] = useState("barracks");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [layerStyle, setLayerStyle] = useState({
        color: "#ff0000",
        weight: 6,
        fillOpacity: 0.45
    });

    const layerRef = useRef(null);
    const map = useMap();

    // ---- FUNKCJA POBIERANIA DANYCH ----
    const fetchData = async (type) => {
        setLoading(true);
        setData(null);

        // ---- KROK 3: Rozdzielenie logiki ----
        if (type === "all") {
            // Logika dla "Pokaż wszystkie" - pobieranie z serwera Overpass
            const typesFilter = ["barracks", "naval_base"].join('|');
            const query = `[out:json][timeout:60];area["ISO3166-1"="PL"]->.a;(way["military"~"${typesFilter}"](area.a);relation["military"~"${typesFilter}"](area.a););out geom;`;
            const overpassUrl = "https://overpass.kumi.systems/api/interpreter?data=" + encodeURIComponent(query);

            try {
                const res = await axios.get(overpassUrl);
                const geojson = osmtogeojson(res.data);
                setData(geojson);
            } catch (e) {
                console.error("Błąd pobierania wszystkich warstw:", e);
            } finally {
                setLoading(false);
            }
            return; // Kończymy funkcję tutaj, żeby nie szukała pliku all.json
        }

        // ---- TWOJA PIERWOTNA LOGIKA (bez zmian) ----
        const url = `/data/${type}.json`;
        try {
            console.log("step 1");
            const result = await fetch(url);
            if (!result.ok) {
                console.error("Błąd odczytu pliku", url);
                return;
            }
            const geojson = await result.json();
            setData(geojson);
        } catch (error) {
            console.error("Błąd pobierania danych:", error);
        } finally {
            setLoading(false);
        }
    };

    // ---- Pobieranie danych przy zmianie typu ----
    useEffect(() => {
        fetchData(militaryType);
    }, [militaryType]);

    // ---- Dopasowanie widoku mapy ----
    useEffect(() => {
        if (!data || !layerRef.current) return;

        const bounds = layerRef.current.getBounds();

        if (bounds.isValid()) {
            map.fitBounds(bounds, { animate: true });
        }
    }, [data, map]);

    // ---- RENDER ----
    return (
        <>
            {/* ---- LOADER ---- */}
            {loading && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 99999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "24px",
                        fontWeight: "bold",
                    }}
                >
                    Ładowanie: {MILITARY_LABELS[militaryType]}
                </div>
            )}

            {/* ---- PANEL PRZYCISKÓW ---- */}
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    zIndex: 9999,
                    background: "rgba(255,255,255,0.9)",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    width: "80vw",
                    // TODO: Można przesunąć panel niżej, aby nie zasłaniał zoom controls
                }}
            >
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                    Typ obiektu wojskowego:
                </div>

                {MILITARY_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => setMilitaryType(type)}
                        title={`Pokaż obiekty typu: ${MILITARY_LABELS[type] || type}`}
                        style={{
                            margin: "4px",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #555",
                            background: type === militaryType ? "#c62828" : "#eee",
                            color: type === militaryType ? "#fff" : "#000",
                            cursor: "pointer",
                        }}
                    >
                        {MILITARY_LABELS[type] || type}
                    </button>
                ))}
            </div>

            {/* ---- WARSTWA GEOJSON ---- */}
            {data && (
                <GeoJSON
                    key={`${militaryType}-${JSON.stringify(layerStyle)}`} // Klucz wymusza odświeżenie przy zmianie stylu
                    data={data}
                    ref={layerRef}
                    style={() => ({
                        color: layerStyle.color,
                        weight: layerStyle.weight,
                        opacity: 1,
                        fillColor: layerStyle.color,
                        fillOpacity: layerStyle.fillOpacity,
                    })}
                />
            )}
            {/* ---- ZADANIE 1: LEGENDA (Lewy dolny róg) ---- */}
            {data && (
                <div className="legend-container">
                    <div><strong>Typ:</strong> {MILITARY_LABELS[militaryType]}</div>
                    <div><strong>Liczba obiektów:</strong> {data.features.length}</div>
                </div>
            )}


            {/* ZADANIE 1: LEGENDA (Lewy dolny róg) */}
            {data && (
                <div className="legend-container">
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Legenda</div>
                    <div><strong>Typ:</strong> {MILITARY_LABELS[militaryType]}</div>
                    <div><strong>Obiekty:</strong> {data.features.length}</div>
                </div>
            )}

            {/* ZADANIE 2: STYLE (Prawy dolny róg) */}
            <div className="style-container">
                <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Styl warstwy</div>

                <label>Kolor: </label>
                <input
                    type="color"
                    value={layerStyle.color}
                    onChange={(e) => setLayerStyle({ ...layerStyle, color: e.target.value })}
                /><br />

                <label>Grubość: {layerStyle.weight}</label><br />
                <input
                    type="range" min="1" max="15"
                    value={layerStyle.weight}
                    onChange={(e) => setLayerStyle({ ...layerStyle, weight: parseInt(e.target.value) })}
                /><br />

                <label>Przezroczystość: {layerStyle.fillOpacity}</label><br />
                <input
                    type="range" min="0" max="1" step="0.1"
                    value={layerStyle.fillOpacity}
                    onChange={(e) => setLayerStyle({ ...layerStyle, fillOpacity: parseFloat(e.target.value) })}
                />
            </div>
        </>
    );
}
