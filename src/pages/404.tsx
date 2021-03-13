import * as React from "react"
import {graphql, PageProps} from "gatsby"

import Layout from "src/components/layout"
import SEO from "src/components/seo"
import {NotFoundPageQuery} from "src/generated/graphql";

const NotFoundPage = ({ data, location }: PageProps<NotFoundPageQuery>) => {
  const siteTitle = data.site?.siteMetadata?.title

  return (
    <Layout location={location} title={siteTitle || ''}>
      <SEO title="404: Not Found" />
      <h1>404: Not Found</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Layout>
  )
}

export default NotFoundPage

export const pageQuery = graphql`
  query notFoundPage {
    site {
      siteMetadata {
        title
      }
    }
  }
`
