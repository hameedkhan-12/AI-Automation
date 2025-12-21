import React from 'react'
import MoreCredits from './more-credit';
import { onGetWorkflows } from '../_actions/workflow-connections';
import Workflow from './workflow';


const Workflows = async () => {
    const workflows = await onGetWorkflows();
  return (
    <div>
        <section>
            <MoreCredits />
            {workflows?.length ? (
                workflows.map(workflow => (
                    <Workflow 
                    key={workflow.id}
                    {...workflow}
                    />
                ))
            ) : (
                <p>No Workflows Found</p>
            )}
        </section>
    </div>
  )
}

export default Workflows;