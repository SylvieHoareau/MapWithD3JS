// Définir les dimensions de la carte
const width = 960;
const height = 600;

// Créer un élément SVG
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Définir une projection géographique
const projection = d3.geoMercator()
    .center([55.5364, -21.1151]) // Coordonnées approximatives du centre de La Réunion
    .scale(50000) // Ajuster l'échelle pour zoomer sur la carte
    .translate([width / 2, height / 2]);

// Définir un générateur de chemins pour proeter les données géographiques
const path = d3.geoPath().projection(projection);

// Sélection de l'élément tooltip
const tooltip = d3.select("#tooltip");

// Charger les données GeoJSON de La Réunion
d3.json("reunion.geojson").then(data => {
    // Définir une échelle de couleur pour la densité
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, d3.max(data.features, d => d.properties.DENSITY)]);

    // Chemins des communes avec des couleurs basées sur la densité
    const communes = svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => colorScale(d.properties.DENSITY))
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        // Evénements de survol pour afficher les info-bulles
        .on("mouseover", (event, d) => {
            const population = d.properties.POPULATION;
            const communeName = d.properties.NOM;
            // Info-bulle au survol
            tooltip.style("opacity", 0.9)
                .html(`<strong>${communeName}</strong><br>Population : ${population} habitants`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            // Maquer l'info-bulle lorsque le survol se termine
            tooltip.style("opacity", 0);
        })
        ;

    // Ajouter le texte représentant le nom des communes
    svg.append("g")
        .selectAll("text")
        .data(data.features)
        .enter().append("text")
        .attr("x", d => {
            const centroid = path.centroid(d);
            return centroid[0];
        })
        .attr("y", d => {
            const centroid = path.centroid(d);
            return centroid[1] - 10; // Pour ne pas chevaucher avec les populations
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#000")
        .text(d => d.properties.NOM);

    // Ajouter le texte représentant la population
    svg.append("g")
        .selectAll("text")
        .data(data.features)
        .enter().append("text")
        .attr("x", d => {
            const centroid = path.centroid(d);
            return centroid[0];
        })
        .attr("y", d => {
            const centroid = path.centroid(d);
            return centroid[1]; 
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#000")
        .text(d => d.properties.POPULATION);

    // Légende
    const legendWidth = 300;
    const legendHeight = 20;

    const legend = svg.append("g")
        .attr("transform", `translate(${width - legendWidth - 20}, ${height - legendHeight -20})`);

    const gradient = svg.append("defs").append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(0));

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(d3.max(data.features, d => d.properties.DENSITY)));

    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient");

    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(data.features, d => d.properties.DENSITY)])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5);

    legend.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);

}).catch(error => {
    console.error("Erreur lors du chargement des données GeoJSON : ", error);
});