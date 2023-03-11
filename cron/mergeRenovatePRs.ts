import * as core from '@actions/core';
import * as github from '@actions/github';
import { Repository } from '@octokit/graphql-schema';

export async function mergeRenovatePRs(
	client: ReturnType<typeof github.getOctokit>,
	repoInfo: { owner: string; repo: string },
	log = core.info,
	waitTimeMs = 2000,
) {
	const { owner, repo } = repoInfo;

	const date = new Date();
	if (date.getDay() === 2) {
		log('Skipping auto merge because meow');
		return;
	}

	const data = await client.graphql<{ repository?: Repository }>(
		`query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequests(labels: ["dependencies"], last: 10, states: [OPEN]) {
          nodes {
            title
            author {
              login
            }
            number
            mergeable
            files(first: 1) {
              nodes {
                path
              }
            }
            changedFiles
            commits(last: 1) {
              nodes {
                commit {
                  statusCheckRollup {
                    state
                  }
                }
              }
            }
            reviewDecision
            reviews(first: 10) {
              nodes {
                author {
                  login
                }
              }
            }
          }
        }
      }
    }`,
		{ owner, repo },
	);
	if (!data.repository) {
		throw new Error(`No such repository ${owner}/${repo}`);
	}

	const mergeable = data.repository.pullRequests.nodes?.filter(
		pr =>
			pr &&
			pr.author?.login === 'renovate' &&
			pr.mergeable === 'MERGEABLE' &&
			pr.changedFiles === 1 &&
			pr.files?.nodes?.[0]?.path.split('/').slice(-1)[0] === 'yarn.lock' &&
			pr.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state === 'SUCCESS' &&
			pr.reviewDecision === 'APPROVED',
	);
	if (!mergeable?.length) {
		log('No mergeable PRs');
		return;
	}

	for (const pr of mergeable) {
		if (!pr) {
			continue;
		}
		log(`Merging #${pr.number} - ${pr.title}`);
		await client.rest.pulls.merge({
			owner,
			repo,
			pull_number: pr.number,
		});

		if (waitTimeMs) {
			await new Promise(r => setTimeout(r, waitTimeMs));
		}
	}
}
