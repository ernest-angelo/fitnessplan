import { Pressable, StyleSheet, Text } from 'react-native';

type AppButtonProps = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
};

export default function AppButton({
    title,
    onPress,
    disabled = false,
}: AppButtonProps) {
    return (
        <Pressable
            style={[styles.button, disabled && styles.disabled]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={styles.text}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#000003ff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});