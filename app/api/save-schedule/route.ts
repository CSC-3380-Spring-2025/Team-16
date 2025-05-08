import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { schedule, name } = await req.json();
    
    // Get the email from request headers
    const email = req.headers.get('x-user-email');
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'User email is required to save a schedule'
      }, { status: 400 });
    }
    
    // Validate schedule data
    if (!schedule || typeof schedule !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid schedule data format'
      }, { status: 400 });
    }
    
    try {
      // Save the schedule to Supabase
      const { data, error } = await supabase
        .from('saved_schedules')
        .insert({
          email: email,
          schedule_data: schedule,
          name: name || `Schedule ${new Date().toLocaleDateString()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .select();
      
      if (error) {
        // If the error is about the table not existing, return a specific error message
        if (error.message.includes("relation \"public.saved_schedules\" does not exist")) {
          console.log("The saved_schedules table doesn't exist yet. This is expected for first-time users.");
          return NextResponse.json({
            success: false,
            error: 'The saved_schedules table does not exist yet. Please create it in your Supabase dashboard.',
            needsSetup: true
          }, { status: 400 });
        }
        
        throw error;
      }
    } catch (supabaseError: any) {
      console.error('Error saving schedule:', supabaseError);
      return NextResponse.json({
        success: false,
        error: supabaseError.message || 'An error occurred while saving the schedule'
      }, { status: 500 });
    }
    
    // If we got here, the save was successful
    return NextResponse.json({
      success: true,
      schedule_id: data?.[0]?.id || 'temp-id',
      name: data?.[0]?.name || name
    });
    
  } catch (error) {
    console.error('Error in save-schedule API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}
