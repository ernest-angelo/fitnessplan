import {
    tabBarIcons,
    tabBarOptions,
} from '@/components/custombar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs screenOptions={tabBarOptions}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: tabBarIcons.home,
                }}
            />

            <Tabs.Screen
                name="workout"
                options={{
                    title: 'Workout',
                    tabBarIcon: tabBarIcons.workout,
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: tabBarIcons.profile,
                }}
            />
        </Tabs>
    );
}