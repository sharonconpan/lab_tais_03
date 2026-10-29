/**
 * HU06-03 — Componente ComparePanel
 * RF-020: dos columnas con fichas en paralelo; señal textual/simbólica (▲) para stat mayor
 * RF-021: señal de empate (=) para stats iguales; no depende únicamente del color
 * RF-029: dos slots independientes con selector propio; comparación activa cuando
 *         ambos tienen selección
 *
 * Props: {
 *   result: CompareResult | null;
 *   slotA: PokemonDetail | null;
 *   slotB: PokemonDetail | null;
 *   onSelectA: () => void;
 *   onSelectB: () => void;
 * }
 */
import type { IComponent } from '../../contracts/IComponent';
import type { PokemonDetail, CompareResult, BaseStat } from '../domain/types';
import { i18n } from '../i18n/es';

const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 96 96"
     width="96" height="96"
     role="img"
     data-placeholder="true"
     aria-label="${i18n.sinImagenDisponible}">
  <rect width="96" height="96" fill="#e2e8f0" rx="8"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-size="20" fill="#94a3b8">?</text>
</svg>`.trim();

export interface ComparePanelProps {
  result: CompareResult | null;
  slotA: PokemonDetail | null;
  slotB: PokemonDetail | null;
  onSelectA: () => void;
  onSelectB: () => void;
}

export class ComparePanel implements IComponent<ComparePanelProps> {
  readonly element: HTMLElement;
  private _onSelectA: () => void = () => {};
  private _onSelectB: () => void = () => {};

  constructor(props: ComparePanelProps) {
    this.element = document.createElement('section');
    this.element.className = 'compare-panel';
    this._render(props);
  }

  update(props: ComparePanelProps): void {
    this._render(props);
  }

  destroy(): void {
    this.element.innerHTML = '';
  }

  // ------------------------------------------------------------------ //
  // Renderizado                                                          //
  // ------------------------------------------------------------------ //

  private _render(props: ComparePanelProps): void {
    this._onSelectA = props.onSelectA;
    this._onSelectB = props.onSelectB;
    this.element.innerHTML = '';

    const { result, slotA, slotB } = props;

    // ── Título ────────────────────────────────────────────────────────
    const title = document.createElement('h2');
    title.className = 'compare-panel__title';
    title.textContent = i18n.comparar;
    this.element.appendChild(title);

    // ── Contenedor de los dos slots ───────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'compare-panel__grid';

    const colA = this._buildSlotColumn('A', slotA, result);
    const colB = this._buildSlotColumn('B', slotB, result);
    grid.appendChild(colA);
    grid.appendChild(colB);
    this.element.appendChild(grid);

    // ── Tabla de stats comparados (solo cuando ambos slots están listos) ──
    if (result && slotA && slotB) {
      this.element.appendChild(this._buildStatsTable(result, slotA, slotB));
    }
  }

  // ------------------------------------------------------------------ //
  // Columna de un slot                                                   //
  // ------------------------------------------------------------------ //

  private _buildSlotColumn(
    slot: 'A' | 'B',
    pokemon: PokemonDetail | null,
    _result: CompareResult | null
  ): HTMLElement {
    const col = document.createElement('div');
    col.className = `compare-panel__slot compare-panel__slot--${slot.toLowerCase()}`;
    col.setAttribute('data-slot', slot);

    // ── Botón de selección ────────────────────────────────────────────
    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = `compare-panel__select-btn compare-panel__select-btn--${slot.toLowerCase()}`;
    selectBtn.setAttribute('aria-label', `${i18n.seleccionaCriatura} ${slot}`);
    selectBtn.textContent = i18n.seleccionaCriatura;
    selectBtn.addEventListener('click', () => {
      if (slot === 'A') this._onSelectA();
      else this._onSelectB();
    });
    col.appendChild(selectBtn);

    if (!pokemon) {
      // Slot vacío: mostrar placeholder de selección
      const placeholder = document.createElement('p');
      placeholder.className = 'compare-panel__empty';
      placeholder.textContent = i18n.seleccionaCriatura;
      col.appendChild(placeholder);
      return col;
    }

    // ── Imagen ────────────────────────────────────────────────────────
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'compare-panel__img';
    if (pokemon.imageUrl) {
      const img = document.createElement('img');
      img.src = pokemon.imageUrl;
      img.alt = pokemon.displayName;
      img.width = 96;
      img.height = 96;
      imgWrapper.appendChild(img);
    } else {
      imgWrapper.innerHTML = PLACEHOLDER_SVG;
    }
    col.appendChild(imgWrapper);

    // ── Nombre ────────────────────────────────────────────────────────
    const nameEl = document.createElement('h3');
    nameEl.className = 'compare-panel__name';
    nameEl.textContent = pokemon.displayName;
    col.appendChild(nameEl);

    return col;
  }

  // ------------------------------------------------------------------ //
  // Tabla de stats comparados                                            //
  // ------------------------------------------------------------------ //

  private _buildStatsTable(
    result: CompareResult,
    slotA: PokemonDetail,
    slotB: PokemonDetail
  ): HTMLElement {
    const table = document.createElement('table');
    table.className = 'compare-panel__stats-table';
    table.setAttribute('role', 'table');
    table.setAttribute('aria-label', i18n.estadisticasBase);

    // Cabecera
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['', i18n.slotA, 'Stat', i18n.slotB, ''].forEach((text) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = text;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Cuerpo
    const tbody = document.createElement('tbody');

    // Indexar stats por nombre para acceso rápido
    const mapB = new Map<BaseStat['name'], BaseStat>(slotB.stats.map((s) => [s.name, s]));

    // Iterar en el orden canónico de slotA
    for (const statA of slotA.stats) {
      const statB = mapB.get(statA.name);
      const comparison = result.statResults[statA.name];

      const tr = document.createElement('tr');
      tr.className = 'compare-panel__stat-row';
      tr.setAttribute('data-stat', statA.name);

      // Celda indicador A
      const tdMarkerA = document.createElement('td');
      tdMarkerA.className = 'compare-panel__marker compare-panel__marker--a';
      if (comparison === 'A') {
        const marker = document.createElement('span');
        marker.className = 'stat-winner stat-winner--a';
        marker.setAttribute('data-winner', 'A');
        marker.setAttribute('aria-label', 'Mayor');
        marker.textContent = i18n.mayor; // '▲'
        tdMarkerA.appendChild(marker);
      }

      // Valor A
      const tdValA = document.createElement('td');
      tdValA.className = 'compare-panel__val compare-panel__val--a';
      tdValA.textContent = String(statA.value);

      // Etiqueta del stat (en español)
      const tdLabel = document.createElement('th');
      tdLabel.scope = 'row';
      tdLabel.className = 'compare-panel__stat-label';
      tdLabel.textContent = statA.label;

      // Valor B
      const tdValB = document.createElement('td');
      tdValB.className = 'compare-panel__val compare-panel__val--b';
      tdValB.textContent = String(statB?.value ?? '—');

      // Celda indicador B / empate
      const tdMarkerB = document.createElement('td');
      tdMarkerB.className = 'compare-panel__marker compare-panel__marker--b';
      if (comparison === 'B') {
        const marker = document.createElement('span');
        marker.className = 'stat-winner stat-winner--b';
        marker.setAttribute('data-winner', 'B');
        marker.setAttribute('aria-label', 'Mayor');
        marker.textContent = i18n.mayor; // '▲'
        tdMarkerB.appendChild(marker);
      } else if (comparison === 'tie') {
        const tie = document.createElement('span');
        tie.className = 'stat-tie';
        tie.setAttribute('data-winner', 'tie');
        tie.setAttribute('aria-label', 'Empate');
        tie.textContent = i18n.empate; // '='
        tdMarkerA.appendChild(tie); // lo ponemos en tdMarkerA para visibilidad central
      }

      tr.appendChild(tdMarkerA);
      tr.appendChild(tdValA);
      tr.appendChild(tdLabel);
      tr.appendChild(tdValB);
      tr.appendChild(tdMarkerB);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
  }
}
