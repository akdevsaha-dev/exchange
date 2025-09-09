import { Octokit } from "octokit"
import { Request, Response } from "express"
import { getInstallationAccessToken } from "../lib/accessToken.js"
import { prisma } from "@repo/db"

export const getRepositories = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.params;
        const installation = await prisma.githubAppInstallation.findUnique({
            where: {
                workspaceId
            }
        })

        const installation_id = installation?.installationId
        if (!installation_id) {
            return res.status(404).json({ error: "No GitHub installation found for this workspace" });
        }
        const installation_idNum = parseInt(installation_id, 10)
        const accessToken = await getInstallationAccessToken(installation_idNum);
        const octokit = new Octokit({
            auth: accessToken
        })

        const { data } = await octokit.request('GET /installation/repositories', {
            sort: "created",
            direction: "desc",
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        const repos = data.repositories.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            url: repo.html_url,
            language: repo.language,
            issueCount: repo.open_issues_count
        }))
        res.json({
            totalRepos: data.total_count,
            repos
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Cannot get repositories"
        })
    }
}
