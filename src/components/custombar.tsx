import { Ionicons } from '@expo/vector-icons';

export const tabBarOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#000000ff',
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: {
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
    },
};

export const tabBarIcons = {
    home: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons
            name={focused ? 'home' : 'home-outline'}
            size={24}
            color={color}
        />
    ),

    workout: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons
            name={focused ? 'barbell' : 'barbell-outline'}
            size={24}
            color={color}
        />
    ),

    profile: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons
            name={focused ? 'person' : 'person-outline'}
            size={24}
            color={color}
        />
    ),
};