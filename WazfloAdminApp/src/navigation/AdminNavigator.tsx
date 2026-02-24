import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ShoppingBag, Package, Settings as SettingsIcon, Megaphone, MessageSquare, Shield } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import OrderListScreen from '../screens/Orders/OrderListScreen';
import OrderDetailScreen from '../screens/Orders/OrderDetailScreen';
import ProductListScreen from '../screens/Products/ProductListScreen';
import AddProductScreen from '../screens/Products/AddProductScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import BroadcastListScreen from '../screens/Marketing/BroadcastListScreen';
import ChatListScreen from '../screens/Marketing/ChatListScreen';
import ChatDetailScreen from '../screens/Marketing/ChatDetailScreen';
import WalletScreen from '../screens/Billing/WalletScreen';
import StoreListScreen from '../screens/Platform/StoreListScreen';

import { COLORS } from '../constants/Theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            const user = await SecureStore.getItemAsync('user');
            if (user) {
                const parsed = JSON.parse(user);
                setIsSuperAdmin(parsed.isSuperAdmin === 1);
            }
        };
        checkRole();
    }, []);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderTopColor: COLORS.border,
                    height: 90,
                    paddingBottom: 30,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
            }}
        >
            <Tab.Screen
                name="Stats"
                component={DashboardScreen}
                options={{ tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} /> }}
            />
            <Tab.Screen
                name="Orders"
                component={OrderListScreen}
                options={{ tabBarIcon: ({ color }) => <Package size={24} color={color} /> }}
            />
            <Tab.Screen
                name="Chats"
                component={ChatListScreen}
                options={{ tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} /> }}
            />
            <Tab.Screen
                name="Marketing"
                component={BroadcastListScreen}
                options={{ tabBarIcon: ({ color }) => <Megaphone size={24} color={color} /> }}
            />
            {isSuperAdmin && (
                <Tab.Screen
                    name="Platform"
                    component={StoreListScreen}
                    options={{ tabBarIcon: ({ color }) => <Shield size={24} color={color} /> }}
                />
            )}
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarIcon: ({ color }) => <SettingsIcon size={24} color={color} /> }}
            />
        </Tab.Navigator>
    );
};

const AdminNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
        </Stack.Navigator>
    );
};

export default AdminNavigator;
