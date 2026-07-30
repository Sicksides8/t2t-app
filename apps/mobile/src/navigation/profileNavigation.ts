import { CommonActions, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types';

function dispatchProfileMain(nav: NavigationProp<ParamListBase>) {
  nav.dispatch(
    CommonActions.navigate({
      name: 'ProfileTab',
      params: { screen: 'ProfileMain' },
    }),
  );
}

function dispatchProfileScreen(nav: NavigationProp<ParamListBase>, screen: keyof ProfileStackParamList) {
  nav.dispatch(
    CommonActions.navigate({
      name: 'ProfileTab',
      params: { screen },
    }),
  );
}

function findTabNavigator(navigation: NavigationProp<ParamListBase>) {
  let current: NavigationProp<ParamListBase> | undefined = navigation;
  while (current) {
    const routeNames = current.getState?.().routeNames ?? [];
    if (routeNames.includes('ProfileTab')) {
      return current;
    }
    current = current.getParent?.() as NavigationProp<ParamListBase> | undefined;
  }
  return undefined;
}

function findRootNavigator(navigation: NavigationProp<ParamListBase>) {
  let root: NavigationProp<ParamListBase> | undefined = navigation;
  while (root?.getParent?.()) {
    root = root.getParent() as NavigationProp<ParamListBase>;
  }
  return root;
}

/** Navega al menú raíz del tab Perfil desde cualquier punto de la app. */
export function navigateToProfileMain(navigation: NavigationProp<ParamListBase>) {
  const tabNav = findTabNavigator(navigation);
  if (tabNav) {
    dispatchProfileMain(tabNav);
    return;
  }

  findRootNavigator(navigation)?.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'ProfileTab',
        params: { screen: 'ProfileMain' },
      },
    }),
  );
}

/** Navega a una subpantalla del perfil desde cualquier tab de Main. */
export function navigateToProfileScreen(
  navigation: NavigationProp<ParamListBase>,
  screen: keyof ProfileStackParamList,
) {
  const tabNav = findTabNavigator(navigation);
  if (tabNav) {
    dispatchProfileScreen(tabNav, screen);
    return;
  }

  findRootNavigator(navigation)?.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'ProfileTab',
        params: { screen },
      },
    }),
  );
}

type ProfileStackNavigation = NativeStackNavigationProp<
  ProfileStackParamList,
  keyof ProfileStackParamList
>;

/**
 * Back seguro para subpantallas del ProfileStack.
 * - Si hay historial en el stack → goBack()
 * - Si no → navigate('ProfileMain')
 */
export function profileGoBack(navigation: ProfileStackNavigation): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.navigate('ProfileMain');
}
