// ---- IMPORTY ----
import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import axios from "axios";
import osmtogeojson from "osmtogeojson";

// ---- LISTA TYPÓW ----
const MILITARY_TYPES = [
    "barracks",
    "naval_base",
    // TODO: Dodaj więcej typów:
    // "airfield", "training_area", "range", "office", "danger_area", "shelter", "bunker"
];

// ---- ETYKIETY ----
const MILITARY_LABELS = {
    barracks: "Koszary",
    naval_base: "Baza morska",
    // TODO: Dodaj tłumaczenia dla nowych typów
};

// ---- KOMPONENT ----
export default function MilitaryOSMLayer() {
    const [militaryType, setMilitaryType] = useState("barracks");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const layerRef = useRef(null);
    const map = useMap();

    // ---- FUNKCJA POBIERANIA DANYCH ----
    const fetchData = async (type) => {
        setLoading(true);
        setData(null);

        const query = `
      [out:json][timeout:60];
      area["ISO3166-1"="PL"]->.a;
      (
        way["military"="${type}"](area.a);
        relation["military"="${type}"](area.a);
      );
      out geom;
    `;

        const requestUrl =
            "https://overpass.kumi.systems/api/interpreter?data=" +
            encodeURIComponent(query);

        try {
            const res = await axios.get(requestUrl);

            // Debug:
            // console.log("Overpass response:", res.data);

            const geojson = osmtogeojson(res.data);
            setData(geojson);
        } catch (e) {
            console.error("Błąd Overpass:", e);
            setData(null);
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
                    key={militaryType}
                    data={data}
                    ref={layerRef}
                    style={() => ({
                        color: "#ff0000",
                        weight: 6,
                        opacity: 1,
                        fillColor: "#ff0000",
                        fillOpacity: 0.45,
                    })}
                />
            )}
        </>
    );
}
 