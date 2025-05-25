import { createRouter, createRoute } from '@tanstack/react-router'
import { rootRoute } from './root'
import Home from '../pages/home/Page'
import Detail from '../pages/detail/Page'
import * as PATH from './constants'
import ViewCh from '../pages/view/Page'
import NotFound from '../pages/notfound/Page'
import Search from '@/pages/search/Page'

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
  notFoundRoute
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
