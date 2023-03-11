import * as core from '@actions/core';
import * as github from '@actions/github';

interface Options {
	owner: string;
	repo: string;
	issueNumber: number;
	eventName: string;
	action?: string;
	excludedUsers?: string;
	author?: string;
	owningTeam?: string;
}

export const REVIEWERS = ['pauliesnug'];

export async function randomAssign(
	client: ReturnType<typeof github.getOctokit>,
	options: Options,
	log = core.info,
) {
	const { author, owner, repo, issueNumber, action, owningTeam } = options;

	if (options.eventName !== 'pull_request_target') {
		return;
	}
	if (action !== 'opened') {
		log(`Skipping assignment for ${action} action`);
		return;
	}
	if (owningTeam) {
		log(`Skipping assignment for team ${owningTeam}`);
		return;
	}

	const excludedUsers =
		options.excludedUsers?.split(',').map(u => u.trim()) ?? [];
	if (author) excludedUsers.push(author);

	const reviewer = await getRandomReviewer(REVIEWERS, excludedUsers);
	log(
		`Assigning #${issueNumber} by @${author} to @${reviewer}`,
	);

	await client.rest.issues.addAssignees({
		owner,
		repo,
		issue_number: issueNumber,
		assignees: [reviewer],
	});
}

async function getRandomReviewer(
	reviewers: string[],
	excludedUsers?: string[],
): Promise<string> {
	let randomReviewer: string;
	let overflow = 0;
	do {
		randomReviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
		if (overflow++ > 100) {
			throw new Error(
				`Stuck in loop picking reviewer with excluded users: ${excludedUsers}`,
			);
		}
	} while (excludedUsers?.includes(randomReviewer));
	return randomReviewer;
}
