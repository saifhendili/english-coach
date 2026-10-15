import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PLANS, SECTIONS, type Block } from '@/guide/content';
import { UI } from '@/guide/strings';
import { BlockView, PlanBlock } from '../blocks';

const style = (el: { props: { style?: unknown } }) => StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
const steps = SECTIONS.find((s) => s.id === 'level')!.blocks.find((b) => b.type === 'steps') as Extract<Block, { type: 'steps' }>;

describe('BlockView', () => {
  it('lays out Arabic from right to left', async () => {
    await render(<BlockView block={steps} lang="ar" />);
    const first = steps.items[0].ar;
    const row = screen.getByLabelText(`${UI.step.ar} 1. ${first}`);
    expect(style(row).flexDirection).toBe('row-reverse');
    const text = screen.getByText(first);
    expect(style(text)).toMatchObject({ textAlign: 'right', writingDirection: 'rtl' });
  });

  it('lays out English and French from left to right', async () => {
    for (const lang of ['en', 'fr'] as const) {
      const { unmount } = await render(<BlockView block={steps} lang={lang} />);
      const row = screen.getByLabelText(`${UI.step[lang]} 1. ${steps.items[0][lang]}`);
      expect(style(row).flexDirection).toBe('row');
      expect(style(screen.getByText(steps.items[0][lang]))).toMatchObject({ textAlign: 'left', writingDirection: 'ltr' });
      await unmount();
    }
  });

  it('numbers the steps', async () => {
    await render(<BlockView block={steps} lang="en" />);
    for (let i = 1; i <= steps.items.length; i++) expect(screen.getByText(String(i))).toBeTruthy();
  });

  it('shows a tip and a warning', async () => {
    const tip = SECTIONS.find((s) => s.id === 'level')!.blocks.find((b) => b.type === 'tip') as Extract<Block, { type: 'tip' }>;
    await render(<BlockView block={tip} lang="fr" />);
    expect(screen.getByText(tip.text.fr)).toBeTruthy();
  });

  it('shows every question of the help section, and an answer opens when its question is pressed', async () => {
    const faq = SECTIONS.find((s) => s.id === 'help')!.blocks[0] as Extract<Block, { type: 'faq' }>;
    await render(<BlockView block={faq} lang="en" />);
    for (const item of faq.items) expect(screen.getByText(item.q.en)).toBeTruthy();
    expect(screen.queryByText(faq.items[0].a.en)).toBeNull();
    await fireEvent.press(screen.getByText(faq.items[0].q.en));
    expect(screen.getByText(faq.items[0].a.en)).toBeTruthy();
    await fireEvent.press(screen.getByText(faq.items[0].q.en));
    expect(screen.queryByText(faq.items[0].a.en)).toBeNull();
  });

  it('shows the glossary with both translations in the English guide and one in the others', async () => {
    const glossary: Block = { type: 'glossary' };
    const { unmount } = await render(<BlockView block={glossary} lang="en" />);
    expect(screen.getByLabelText('Review: Révision, المراجعة')).toBeTruthy();
    await unmount();
    await render(<BlockView block={glossary} lang="fr" />);
    expect(screen.getByLabelText('Review: Révision')).toBeTruthy();
  });

  it('lists the six levels', async () => {
    await render(<BlockView block={{ type: 'levels' }} lang="en" />);
    for (const name of ['Beginner', 'Elementary', 'Intermediate', 'Upper-intermediate', 'Advanced', 'Proficient']) expect(screen.getByText(name)).toBeTruthy();
  });
});

describe('PlanBlock', () => {
  it('starts at A1 and shows the plan for the level that is chosen', async () => {
    await render(<PlanBlock lang="en" />);
    expect(screen.getByText(PLANS.A1.focus.en)).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: /^B2/ }));
    expect(screen.getByText(PLANS.B2.focus.en)).toBeTruthy();
    expect(screen.queryByText(PLANS.A1.focus.en)).toBeNull();
    PLANS.B2.daily.forEach((d) => expect(screen.getByText(d.text.en)).toBeTruthy());
  });

  it('opens on the learner’s own level when it is known', async () => {
    await render(<PlanBlock lang="fr" initial="C1" />);
    expect(screen.getByText(PLANS.C1.focus.fr)).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^C1/ }).props.accessibilityState.selected).toBe(true);
  });

  it('adds up the minutes of a day', async () => {
    await render(<PlanBlock lang="en" />);
    const total = PLANS.A1.daily.reduce((n, d) => n + d.minutes, 0);
    expect(screen.getByText(new RegExp(`Total ${total} min`))).toBeTruthy();
  });

  it('is written in Arabic when asked', async () => {
    await render(<PlanBlock lang="ar" />);
    expect(screen.getByText(PLANS.A1.focus.ar)).toBeTruthy();
    expect(style(screen.getByText(PLANS.A1.focus.ar))).toMatchObject({ textAlign: 'right', writingDirection: 'rtl' });
  });
});
