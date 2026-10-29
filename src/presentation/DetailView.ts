/**
 * HU03-02 — Componente DetailView
 * RF-003: placeholder cuando imageUrl es null
 * RF-012: imagen, número, nombre, tipos, altura, peso, habilidades, 6 stats
 * RF-013: botón Volver invoca onBack para que main.ts restaure el CatalogContext
 *
 * Props: { detail: PokemonDetail; onBack: () => void }
 */
import type { IComponent } from '../../contracts/IComponent';
import type { PokemonDetail } from '../domain/types';
import { i18n } from '../i18n/es';

export interface DetailViewProps {
  detail: PokemonDetail;
  onBack: () => void;
}

const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 160 160"
     width="160" height="160"
     role="img"
     data-placeholder="true"
     aria-label="${i18n.sinImagenDisponible}">
  <rect width="160" height="160" fill="#e2e8f0" rx="12"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-size="24" fill="#94a3b8">?</text>
</svg>`.trim();

export class DetailView implements IComponent<DetailViewProps> {
  readonly element: HTMLElement;
  private _onBack: () => void = () => {};

  constructor(props: DetailViewProps) {
    this.element = document.createElement('article');
    this.element.className = 'detail-view';
    this._render(props);
  }

  update(props: DetailViewProps): void {
    this._render(props);
  }

  destroy(): void {
    this.element.innerHTML = '';
  }

  // ------------------------------------------------------------------ //
  // Renderizado                                                          //
  // ------------------------------------------------------------------ //

  private _render(props: DetailViewProps): void {
    this._onBack = props.onBack;
    this.element.innerHTML = '';

    const { detail } = props;

    // ── Botón Volver ─────────────────────────────────────────────────
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'detail-view__back';
    backBtn.textContent = i18n.volver;
    backBtn.addEventListener('click', () => this._onBack());
    this.element.appendChild(backBtn);

    // ── Cabecera: imagen + identidad ──────────────────────────────────
    const header = document.createElement('header');
    header.className = 'detail-view__header';

    // Imagen o placeholder (RF-003)
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'detail-view__img';
    if (detail.imageUrl) {
      const img = document.createElement('img');
      img.src = detail.imageUrl;
      img.alt = detail.displayName;
      img.width = 160;
      img.height = 160;
      imgWrapper.appendChild(img);
    } else {
      imgWrapper.innerHTML = PLACEHOLDER_SVG;
    }
    header.appendChild(imgWrapper);

    // Número y nombre
    const identity = document.createElement('div');
    identity.className = 'detail-view__identity';

    const numEl = document.createElement('span');
    numEl.className = 'detail-view__number';
    numEl.textContent = `${i18n.numero}${detail.id}`;
    identity.appendChild(numEl);

    const nameEl = document.createElement('h2');
    nameEl.className = 'detail-view__name';
    nameEl.textContent = detail.displayName;
    identity.appendChild(nameEl);

    header.appendChild(identity);
    this.element.appendChild(header);

    // ── Tipos (RF-012) ────────────────────────────────────────────────
    const typesSection = document.createElement('section');
    typesSection.className = 'detail-view__section';
    const typesLabel = document.createElement('h3');
    typesLabel.textContent = i18n.tipos;
    typesSection.appendChild(typesLabel);

    const typesList = document.createElement('ul');
    typesList.className = 'detail-view__types';
    for (const type of detail.types) {
      const li = document.createElement('li');
      li.className = `detail-view__type detail-view__type--${type}`;
      li.textContent = type;
      typesList.appendChild(li);
    }
    typesSection.appendChild(typesList);
    this.element.appendChild(typesSection);

    // ── Altura y peso (RF-012) ────────────────────────────────────────
    const physSection = document.createElement('section');
    physSection.className = 'detail-view__section detail-view__section--phys';

    const heightEl = document.createElement('dl');
    heightEl.innerHTML = `<dt>${i18n.altura}</dt><dd>${detail.heightDm} dm</dd>`;
    physSection.appendChild(heightEl);

    const weightEl = document.createElement('dl');
    weightEl.innerHTML = `<dt>${i18n.peso}</dt><dd>${detail.weightHg} hg</dd>`;
    physSection.appendChild(weightEl);

    this.element.appendChild(physSection);

    // ── Habilidades (RF-012) ──────────────────────────────────────────
    const abilitiesSection = document.createElement('section');
    abilitiesSection.className = 'detail-view__section';
    const abilitiesLabel = document.createElement('h3');
    abilitiesLabel.textContent = i18n.habilidades;
    abilitiesSection.appendChild(abilitiesLabel);

    const abilitiesList = document.createElement('ul');
    abilitiesList.className = 'detail-view__abilities';
    for (const ability of detail.abilities) {
      const li = document.createElement('li');
      li.className = 'detail-view__ability';
      li.textContent = ability.isHidden
        ? `${ability.name} (oculta)`
        : ability.name;
      abilitiesList.appendChild(li);
    }
    abilitiesSection.appendChild(abilitiesList);
    this.element.appendChild(abilitiesSection);

    // ── Estadísticas base (RF-012) ────────────────────────────────────
    const statsSection = document.createElement('section');
    statsSection.className = 'detail-view__section detail-view__section--stats';
    const statsLabel = document.createElement('h3');
    statsLabel.textContent = i18n.estadisticasBase;
    statsSection.appendChild(statsLabel);

    const statsList = document.createElement('dl');
    statsList.className = 'detail-view__stats';
    for (const stat of detail.stats) {
      const dt = document.createElement('dt');
      dt.textContent = stat.label;   // Etiqueta en español: PS, Ataque, …
      const dd = document.createElement('dd');
      dd.textContent = String(stat.value);
      statsList.appendChild(dt);
      statsList.appendChild(dd);
    }
    statsSection.appendChild(statsList);
    this.element.appendChild(statsSection);
  }
}
