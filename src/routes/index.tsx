import { createRouter, createRoute } from '@tanstack/react-router'
import { rootRoute } from './root'
import { lazy } from 'react'
import * as PATH from './constants'

const Home = lazy(() => import('../pages/home/Page'))
const Detail = lazy(() => import('../pages/detail/Page'))
const ViewCh = lazy(() => import('../pages/view/Page'))
const Search = lazy(() => import('../pages/search/Page'))
const AdminPage = lazy(() => import('../pages/admin/Page'))
const LoginPage = lazy(() => import('../pages/auth/Page'))
const AuthCallback = lazy(() => import('../pages/auth/Callback'))
const NotFound = lazy(() => import('../pages/notfound/Page'))

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH.HOME_PAGE,
  component: Home,
})

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH.DETAIL_PAGE,
  component: Detail,
})

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH.SEARCH_PAGE,
  component: Search,
})

const viewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH.VIEW_PAGE,
  component: ViewCh,
})
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH.ADMIN_PAGE,
  component: AdminPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH.LOGIN_PAGE,
  component: LoginPage,
})
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PATH.AUTH_CALLBACK_PAGE,
  component: AuthCallback,
})
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: NotFound,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  searchRoute,
  detailRoute,
  viewRoute,
  adminRoute,
  loginRoute,
  authCallbackRoute,
  notFoundRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
