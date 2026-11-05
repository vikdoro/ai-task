# Reflections

I'm happy with the first phase (see [`submission-docs/process-logs/phases.md`](submission-docs/process-logs/phases.md) ), setting up how we log the prompts and other process items. However, I would probably try something simpler next time, see the takeaways below.

Next phase, feature-design, was a dead end with my approach. I used several subagents with different priorities (CTO, Product Designer, Engineering Lead) to work on the same document. The approach may have lead us somewhere, but I felt the conversation became too abstract and complicated, the product spec too long, while I felt once we pin down the data sources and the delivery methods, we would know a lot more about what we can build. Therefore I pivoted to build a local demo first.

To work through the local demo, I used a workflow with three agents: planner, executor, and reviewer. I used a similar workflow before and it worked fine. For this task, though, it may have been an unnecessarily slow process.

# Takeaways

Next time, I would try to copy the prompts over from the local session transcripts before each commit and identify the checks, decisions, interventions at that point. That way maybe the workflow becomes quicker, the context window smaller.

Instead of a local demo with tests and slow checks, I would run a discovery session with a faster work process to find out more about the constraints. After which I would start the feature design and work out the roadmap items.
