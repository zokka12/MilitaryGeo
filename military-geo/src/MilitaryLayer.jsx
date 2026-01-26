import "./MilitaryLayer.css"
import MilitaryButton from "./MilitaryButton.jsx";
// 1. Importujemy nowe komponenty
import MilitaryLegend from "./MilitaryLegend.jsx";
import MilitaryStyleControls from "./MilitaryStyleControls.jsx";

import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import axios from "axios";
import osmtogeojson from "osmtogeojson";

const MILITARY_TYPES = [
    "barracks", "naval_base", "airfield", "training_area", "range",
    "office", "danger_area", "shelter", "bunker",
];

const MILITARY_LABELS = {
    barracks: "Koszary", naval_base: "Baza morska", airfield: "Lotnisko wojskowe",
    training_area: "Obszar szkoleniowy", range: "Poligon", office: "Administracja wojskowa",
    danger_area: "Strefa niebezpieczna", shelter: "Schron", bunker: "Bunkier",
    all: "Wszystkie obiekty wojskowe"
};

export default function MilitaryOSMLayer() {
    const [militaryType, setMilitaryType] = useState("barracks");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [layerStyle, setLayerStyle] = useState({
        color: "#24758d",
        weight: 6,
        fillOpacity: 0.45
    });

    const layerRef = useRef(null);
    const map = useMap();

    const fetchData = async (type) => {
        setLoading(true);
        setData(null);

        if (type === "all") {
            // Skoro usunęliśmy "all" z tablicy, teraz po prostu łączymy wszystkie typy
            const typesFilter = MILITARY_TYPES.join('|');

            console.log("Wysyłam zapytanie o typy:", typesFilter); // Podgląd w konsoli (F12)

           
            const query = `[out:json][timeout:90];
                area["ISO3166-1"="PL"]->.a;
                (
                  nwr["military"~"^(${typesFilter})$"](area.a);
                );
                out geom;`;

        
            const overpassUrl = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

            try {
                const res = await axios.get(overpassUrl);
                const geojson = osmtogeojson(res.data);
                setData(geojson);
            } catch (e) {
                console.error("Błąd pobierania:", e);
            } finally {
                setLoading(false);
            }
            return;
        }

        const url = `/data/${type}.json`;
        try {
            const result = await fetch(url);
            if (result.ok) setData(await result.json());
        } catch (error) {
            console.error("Błąd:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(militaryType); }, [militaryType]);

    useEffect(() => {
        if (!data || !layerRef.current) return;
        const bounds = layerRef.current.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { animate: true });
    }, [data, map]);

    return (
        <>
            {loading && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(25, 8, 99, 0.5)", zIndex: 99999, display: "flex",
                    alignItems: "center", justifyContent: "center", color: "white", fontSize: "24px"
                }}>
                    Ładowanie: {MILITARY_LABELS[militaryType]}
                </div>
            )}

            {/* 2. PANEL PRZYCISKÓW */}
            <div className="button-panel">

                <div style={{ width: "100%", fontWeight: "bold", marginBottom: "10px" , textAlign: "center", fontSize: "16px"}}>
                    Typ obiektu wojskowego:
                </div>

                {/* GRUPA 1: Konkretne typy (generowane z pętli) */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                    {MILITARY_TYPES.map((type) => (
                        <MilitaryButton
                            key={type}
                            label={MILITARY_LABELS[type] || type}
                            isActive={type === militaryType}
                            onClick={() => setMilitaryType(type)}
                        />
                    ))}
                </div>

                {/* LINIA ROZDZIELAJĄCA */}
                <div style={{ width: "100%", height: "1px", background: "#ccc", marginBottom: "10px" }}></div>

                {/* GRUPA 2: Przycisk specjalny "Wszystkie" */}
                <div style={{ width: "100%", fontSize: "13px", color: "#525581", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MilitaryButton
                        label={MILITARY_LABELS["all"]} // "Wszystkie obiekty wojskowe"
                        isActive={militaryType === "all"}
                        onClick={() => setMilitaryType("all")}
                    />
                    {"Uwaga: może ładować się dłużej"}
                </div>

            </div>
            {data && (
                <GeoJSON
                    key={`${militaryType}-${JSON.stringify(layerStyle)}`}
                    data={data}
                    ref={layerRef}
                    style={() => ({
                        color: layerStyle.color,
                        weight: layerStyle.weight,
                        opacity: 1,
                        fillColor: layerStyle.color,
                        fillOpacity: layerStyle.fillOpacity,
                    })}
                    onEachFeature={(feature, layer) => {
                        if (feature.properties?.name) layer.bindPopup(feature.properties.name);
                    }}
                />
            )}

            {/* 2. Użycie nowych komponentów - zobacz jak czysto! */}
            {data && (
                <MilitaryLegend
                    label={MILITARY_LABELS[militaryType]}
                    count={data.features.length}
                />
            )}

            <MilitaryStyleControls
                style={layerStyle}
                setStyle={setLayerStyle}
            />
        </>
    );
}