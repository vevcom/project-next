import '@pn-server-only'
import rehypeFormat from 'rehype-format'
import rehypeParse from 'rehype-parse'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

/**
 * Renders markdown to html that is safe to inject into a page or an email.
 *
 * Raw html in the markdown is dropped by remark-rehype, but markdown syntax alone still produces
 * dangerous html - `[x](javascript:...)` becomes a script-running link - so the tree is run through
 * rehype-sanitize's default (GitHub) schema, which only lets through whitelisted tags, attributes
 * and url protocols.
 */
export async function markdownToSafeHtml(markdown: string): Promise<string> {
    return (await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeFormat)
        .use(rehypeStringify)
        .process(markdown)).toString()
}

/**
 * Sanitizes html that did not come from `markdownToSafeHtml` - imported html, or html stored
 * before it was sanitized - with the same schema.
 */
export async function sanitizeHtml(html: string): Promise<string> {
    return (await unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(html)).toString()
}
