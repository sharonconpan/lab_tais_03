/**
 * HU01-05 — Componente PokemonList
 * RF-001, RF-007, RF-016
 *
 * Props: { items: PokemonEntry[]; onSelect: (id: number) => void }
 * - items vacío → mensaje "sin resultados" en español
 * - items con contenido → una PokemonCard por entrada
 */
import type { IComponent } from '../../contracts/IComponent';
import type { PokemonEntry } from '../domain/types';
import { PokemonCard } from './PokemonCard';
import { i18n } from '../i18n/es';

export interface PokemonListProps {
  items: PokemonEntry[];
  onSelect: (id: number) => void;
}

export class PokemonList implements IComponent<PokemonListProps> {
  readonly element: HTMLElement;
  private _cards: PokemonCard[] = [];

  constructor(props: PokemonListProps) {
    this.element = document.createElement('section');
    this.element.setAttribute('aria-label', 'Lista de criaturas');
    this._render(props);
  }

  update(props: PokemonListProps): void {
    this._destroyCards();
    this._render(props);
  }

  destroy(): void {
    this._destroyCards();
  }

  private _destroyCards(): void {
    this._cards.forEach((c) => c.destroy());
    this._cards = [];
  }

  private _render(props: PokemonListProps): void {
    this.element.innerHTML = '';

    if (props.items.length === 0) {
      const empty = document.createElement('p');
      empty.setAttribute('data-empty', 'true');
      empty.textContent = i18n.sinResultados.replace('{term}', '');
      this.element.appendChild(empty);
      return;
    }

    const grid = document.createElement('ul');
    grid.className = 'pokemon-list__grid';
    grid.setAttribute('role', 'list');

    for (const entry of props.items) {
      const li = document.createElement('li');
      li.setAttribute('role', 'listitem');
      const card = new PokemonCard({ entry, onClick: props.onSelect });
      this._cards.push(card);
      li.appendChild(card.element);
      grid.appendChild(li);
    }

    this.element.appendChild(grid);
  }
}
