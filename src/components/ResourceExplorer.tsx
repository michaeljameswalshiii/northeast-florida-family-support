"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Flag, MapPin, Phone, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { AGE_GROUPS, CATEGORIES, COUNTIES, RESOURCES } from "@/data/resources";

export function ResourceExplorer() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [age, setAge] = useState("");
  const [visible, setVisible] = useState(9);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return RESOURCES.filter((resource) => {
      const searchable = [resource.name, resource.description, ...resource.categories, ...resource.settings].join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory = !category || resource.categories.includes(category as (typeof resource.categories)[number]);
      const matchesCounty = !county || resource.counties.includes("All Northeast Florida") || resource.counties.includes(county as (typeof resource.counties)[number]);
      const matchesAge = !age || resource.ages.includes(age as (typeof resource.ages)[number]);
      return matchesSearch && matchesCategory && matchesCounty && matchesAge;
    });
  }, [age, category, county, search]);

  const activeFilters = [category, county, age, search].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setCategory("");
    setCounty("");
    setAge("");
    setVisible(9);
  }

  return (
    <div className="resource-layout">
      <aside className="filter-panel" aria-label="Resource filters">
        <div className="filter-title">
          <span><SlidersHorizontal size={18} /> Filters</span>
          {activeFilters ? <button type="button" onClick={clearFilters}><RotateCcw size={14} /> Clear</button> : null}
        </div>
        <label className="search-field">
          <span>Search by need or organization</span>
          <div><Search size={17} /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisible(9); }} placeholder="Try “speech” or “waiver”" /></div>
        </label>
        <fieldset>
          <legend>Service category</legend>
          <div className="filter-options">
            {CATEGORIES.map((item) => (
              <label key={item} className={category === item ? "is-selected" : ""}>
                <input type="radio" name="category" value={item} checked={category === item} onChange={() => { setCategory(category === item ? "" : item); setVisible(9); }} />
                <span className="filter-check">{category === item ? <Check size={12} /> : null}</span>
                <span>{item}</span>
                <em>{RESOURCES.filter((resource) => resource.categories.includes(item)).length}</em>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          County
          <select value={county} onChange={(event) => { setCounty(event.target.value); setVisible(9); }}>
            <option value="">All Northeast Florida</option>
            {COUNTIES.filter((item) => item !== "All Northeast Florida").map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Age range
          <select value={age} onChange={(event) => { setAge(event.target.value); setVisible(9); }}>
            <option value="">Any age</option>
            {AGE_GROUPS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </aside>

      <section className="resource-results" aria-live="polite">
        <div className="results-head">
          <div>
            <p className="eyebrow">Available support</p>
            <h2>{filtered.length} trusted starting {filtered.length === 1 ? "point" : "points"}</h2>
          </div>
          <p>Contact providers directly to confirm openings, eligibility, insurance, and service area.</p>
        </div>
        {filtered.length ? (
          <div className="resource-cards">
            {filtered.slice(0, visible).map((resource) => (
              <article className={`resource-card${resource.featured ? " is-featured" : ""}`} key={resource.id}>
                {resource.featured ? <span className="featured-tag">Good place to start</span> : null}
                <div className="resource-card-top">
                  <span className="resource-index">{String(RESOURCES.indexOf(resource) + 1).padStart(2, "0")}</span>
                  <div>
                    <p>{resource.categories[0]}</p>
                    <h3>{resource.name}</h3>
                  </div>
                </div>
                <p className="resource-description">{resource.description}</p>
                <dl>
                  <div><dt>Serves</dt><dd>{resource.counties.join(", ")}</dd></div>
                  <div><dt>Ages</dt><dd>{resource.ages.join(", ")}</dd></div>
                  <div><dt>Access</dt><dd>{resource.settings.join(" · ")}</dd></div>
                  {resource.cost ? <div><dt>Cost</dt><dd>{resource.cost}</dd></div> : null}
                  <div><dt>Verified</dt><dd>September 20, 2026</dd></div>
                </dl>
                <div className="resource-actions">
                  <a href={resource.url} target="_blank" rel="noreferrer">Visit website <ArrowUpRight size={16} /></a>
                  {resource.phone ? <a href={`tel:${resource.phone.replace(/[^\d+]/g, "")}`}><Phone size={15} /> {resource.phone}</a> : null}
                </div>
                <a className="report-link" href={`/report-resource?resource=${encodeURIComponent(resource.name)}`}><Flag size={13} /> Report outdated information</a>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <MapPin size={30} />
            <h3>No exact matches yet</h3>
            <p>Try removing a filter or ask the Support Guide for a broader path.</p>
            <button type="button" onClick={clearFilters}>Reset all filters</button>
          </div>
        )}
        {visible < filtered.length ? (
          <button className="load-more" type="button" onClick={() => setVisible((current) => current + 9)}>
            Show more resources <span>{visible} of {filtered.length}</span>
          </button>
        ) : null}
      </section>
    </div>
  );
}
