/**
 * HU01-04 — Componente PokemonCard
 * RF-001, RF-003
 *
 * Props: { entry: PokemonEntry; imageUrl: string | null; onClick: (id: number) => void }
 * - Muestra imagen con alt=nombre, número nacional y nombre
 * - Cuando imageUrl es null → SVG placeholder con mismo espacio visual
 * - Al hacer clic invoca onClick(entry.id)
 */
import type { IComponent } from '../../contracts/IComponent';
import type { PokemonEntry } from '../domain/types';
import { i18n } from '../i18n/es';

export interface PokemonCardProps {
  entry: PokemonEntry;
  onClick: (id: number) => void;
}

const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 96 96"
     width="96" height="96"
     role="img"
     data-placeholder="true"
     aria-label="${i18n.sinImagenDisponible}">
  <rect width="96" height="96" fill="#e2e8f0" rx="8"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-size="14" fill="#94a3b8">?</text>
</svg>`.trim();

export class PokemonCard implements IComponent<PokemonCardProps> {
  readonly element: HTMLElement;
  private _onClick: (id: number) => void = () => {};
  private _entry!: PokemonEntry;

  constructor(props: PokemonCardProps) {
    this.element = document.createElement('article');
    this.element.style.cursor = 'pointer';
    this.element.addEventListener('click', this._handleClick);
    this._render(props);
  }

  update(props: PokemonCardProps): void {
    this._render(props);
  }

  destroy(): void {
    this.element.removeEventListener('click', this._handleClick);
  }

  private _handleClick = (): void => {
    this._onClick(this._entry.id);
  };

  private _render(props: PokemonCardProps): void {
    this._onClick = props.onClick;
    this._entry = props.entry;

    this.element.setAttribute('data-pokemon-id', String(props.entry.id));
    this.element.innerHTML = '';

    // Imagen o placeholder
    const imgContainer = document.createElement('div');
    imgContainer.className = 'pokemon-card__img';

    if (props.entry.imageUrl) {
      const img = document.createElement('img');
      img.src = props.entry.imageUrl;
      img.alt = props.entry.displayName;
      img.width = 96;
      img.height = 96;
      img.loading = 'lazy';
      imgContainer.appendChild(img);
    } else {
      imgContainer.innerHTML = PLACEHOLDER_SVG;
    }
    this.element.appendChild(imgContainer);

    // Número nacional
    const num = document.createElement('span');
    num.className = 'pokemon-card__number';
    num.textContent = `${i18n.numero}${props.entry.id}`;
    this.element.appendChild(num);

    // Nombre
    const name = document.createElement('span');
    name.className = 'pokemon-card__name';
    name.textContent = props.entry.displayName;
    this.element.appendChild(name);
  }
}
