import { CommonActions, type NavigationProp, type ParamListBase } from '@react-navigation/native';

function dispatchExploreTab(nav: NavigationProp<ParamListBase>) {
  nav.dispatch(
    CommonActions.navigate({
      name: 'ExploreTab',
    }),
  );
}

/** Navega al tab Explorar desde Home, Mis cursos u otras pantallas dentro de MainTabs. */
export function navigateToExploreTab(navigation: NavigationProp<ParamListBase>) {
  const ownRoutes = navigation.getState?.().routeNames ?? [];
  if (ownRoutes.includes('ExploreTab')) {
    dispatchExploreTab(navigation);
    return;
  }

  let current: NavigationProp<ParamListBase> | undefined = navigation;
  while (current) {
    const routeNames = current.getState?.().routeNames ?? [];
    if (routeNames.includes('ExploreTab')) {
      dispatchExploreTab(current);
      return;
    }
    current = current.getParent?.() as NavigationProp<ParamListBase> | undefined;
  }

  // Stack raíz: Main contiene el bottom tab navigator
  let root: NavigationProp<ParamListBase> | undefined = navigation;
  while (root?.getParent?.()) {
    root = root.getParent() as NavigationProp<ParamListBase>;
  }
  root?.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'ExploreTab',
      },
    }),
  );
}
