import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { AppText } from '../Text';

const styleOf = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style);

describe('AppText', () => {
  it('uses the font file for the weight', async () => {
    await render(<AppText weight="700">Bold words</AppText>);
    expect(styleOf('Bold words').fontFamily).toBe('PlusJakartaSans_700Bold');
  });

  it('switches to the real italic face and does not slant it a second time', async () => {
    await render(<AppText style={{ fontStyle: 'italic' }}>Slanted</AppText>);
    expect(styleOf('Slanted')).toMatchObject({ fontFamily: 'PlusJakartaSans_500Medium_Italic', fontStyle: 'normal' });
  });

  it('has a bold italic face too', async () => {
    await render(<AppText weight="700" style={{ fontStyle: 'italic' }}>Both</AppText>);
    expect(styleOf('Both').fontFamily).toBe('PlusJakartaSans_700Bold_Italic');
  });

  it('keeps asking for italic when a weight has no italic file (the system may still slant it)', async () => {
    await render(<AppText weight="800" style={{ fontStyle: 'italic' }}>Heavy</AppText>);
    expect(styleOf('Heavy')).toMatchObject({ fontFamily: 'PlusJakartaSans_800ExtraBold', fontStyle: 'italic' });
  });
});
