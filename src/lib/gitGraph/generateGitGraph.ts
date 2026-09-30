/**
 * Generates a snapshot of the project's git graph for the release countdown.
 * Git history is not available inside the docker containers, so the snapshot is committed next to this file.
 *
 * Run with: npm run gitGraph:generate
 */
import { execFileSync } from 'child_process'
import { writeFileSync } from 'fs'
import path from 'path'
import type { GitGraph, GitGraphCommit } from './types'

const REPOSITORY = 'https://github.com/vevcom/project-next'
const OUTPUT_PATH = path.join(__dirname, 'gitGraph.json')
const MAX_SUBJECT_LENGTH = 72
const FIELD_SEPARATOR = '\x1f'

const ref = process.argv[2] ?? 'HEAD'

const format = ['%H', '%P', '%an', '%at', '%s'].join(FIELD_SEPARATOR)
const log = execFileSync(
    'git',
    ['log', '--topo-order', `--format=${format}`, ref],
    { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }
)

// Newest first, as git log outputs them.
const commits = log.trim().split('\n').map(line => {
    const [hash, parents, author, timestamp, subject] = line.split(FIELD_SEPARATOR)
    return {
        hash,
        parents: parents ? parents.split(' ') : [],
        author,
        timestamp: Number(timestamp),
        subject: subject.length > MAX_SUBJECT_LENGTH ? `${subject.slice(0, MAX_SUBJECT_LENGTH - 1)}…` : subject,
    }
})

// Assign lanes the same way `git log --graph` does: walking from newest to oldest, each lane
// holds the hash of the commit it is waiting for.
const lanes: (string | null)[] = []
const allocateLane = () => {
    const free = lanes.indexOf(null)
    return free === -1 ? lanes.length : free
}
const laneOfCommit = new Map<string, number>()
commits.forEach(commit => {
    const waitingLane = lanes.indexOf(commit.hash)
    const lane = waitingLane === -1 ? allocateLane() : waitingLane
    laneOfCommit.set(commit.hash, lane)

    // Branches that were waiting for this commit merge into it here.
    lanes.forEach((waitingFor, index) => {
        if (waitingFor === commit.hash) lanes[index] = null
    })

    const [firstParent, ...otherParents] = commit.parents
    lanes[lane] = firstParent ?? null
    otherParents.forEach(parent => {
        if (!lanes.includes(parent)) lanes[allocateLane()] = parent
    })
})

const oldestFirst = commits.toReversed()
const indexOfCommit = new Map(oldestFirst.map((commit, index) => [commit.hash, index]))
const authors = Array.from(new Set(oldestFirst.map(commit => commit.author)))
const indexOfAuthor = new Map(authors.map((author, index) => [author, index]))

const graph: GitGraph = {
    repository: REPOSITORY,
    head: commits[0]?.hash ?? '',
    generatedAt: new Date().toISOString(),
    laneCount: Math.max(0, ...Array.from(laneOfCommit.values())) + 1,
    authors,
    commits: oldestFirst.map((commit): GitGraphCommit => [
        commit.hash.slice(0, 7),
        laneOfCommit.get(commit.hash) ?? 0,
        commit.parents.flatMap(parent => {
            const index = indexOfCommit.get(parent)
            return index === undefined ? [] : [index]
        }),
        indexOfAuthor.get(commit.author) ?? 0,
        commit.timestamp,
        commit.subject,
    ]),
}

writeFileSync(OUTPUT_PATH, JSON.stringify(graph))
console.log(`Wrote ${graph.commits.length} commits in ${graph.laneCount} lanes to ${OUTPUT_PATH}`)
